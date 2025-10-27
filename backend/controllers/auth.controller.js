import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { computeNextLockout, remainingLockout, determineLockoutStage } from '../utils/lockout.js';
import { sendLockoutNotification } from '../services/mailer.js';

const buildCookieOptions = (maxAge) => {
    const options = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
        sameSite: process.env.COOKIE_SAMESITE || 'lax',
        maxAge,
        path: '/',
    };

    // Only set domain if valid hostname (no IP, no port, not empty)
    const domain = process.env.COOKIE_DOMAIN?.trim();
    if (domain && domain.length > 0 && !domain.match(/^\d+\.\d+\.\d+\.\d+/) && !domain.includes(':')) {
        options.domain = domain;
    }

    return options;
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password_hash: hashedPassword });
        await user.save();
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        
        // Unified error to prevent user enumeration
        if (!user) {
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        // Check if account is permanently locked
        if (user.isPermanentlyLocked) {
            return res.status(423).json({ 
                error: 'LOCKED', 
                permanent: true,
                message: 'Your account has been permanently locked. Please contact an administrator to unlock your account.'
            });
        }

        // Check if account is temporarily locked
        const lockStatus = remainingLockout(user);
        if (lockStatus && lockStatus.remainingSeconds > 0) {
            return res.status(423).json({
                error: 'LOCKED',
                until: user.lockoutExpiresAt.toISOString(),
                remainingSeconds: lockStatus.remainingSeconds,
                permanent: false,
                message: `Your account is temporarily locked. Please try again later.`
            });
        }

        // Skip password verification for OAuth users
        if (user.oauth_provider && user.oauth_provider !== 'local') {
            return res.status(400).json({ 
                error: 'OAUTH_USER',
                message: 'This account uses OAuth authentication. Please sign in with your OAuth provider.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            // Atomic increment of failure counters
            const consecutiveFailures = (user.consecutiveFailedLoginAttempts || 0) + 1;
            const newStage = determineLockoutStage(consecutiveFailures);

            // Prepare atomic update
            const updateFields = {
                $inc: { 
                    failedLoginAttempts: 1,
                    consecutiveFailedLoginAttempts: 1
                },
                $set: { lastFailedLoginAt: new Date() }
            };

            // Apply lockout if threshold crossed
            if (newStage >= 0) {
                const currentStage = user.lockoutStage || 0;
                
                // Only escalate if we've moved to a new stage or no active lock
                if (newStage > currentStage || !lockStatus || lockStatus.remainingSeconds === 0) {
                    updateFields.$set.lockoutStage = newStage;
                    const { expiresAt, permanent } = computeNextLockout(newStage);
                    
                    if (permanent) {
                        updateFields.$set.isPermanentlyLocked = true;
                        updateFields.$set.lockoutExpiresAt = null;
                        updateFields.$inc.tokenVersion = 1; // Revoke all existing tokens
                        
                        await User.findByIdAndUpdate(user._id, updateFields);
                        
                        // Send lockout notification
                        sendLockoutNotification(user.email, user.username, true).catch(err => 
                            console.error('Failed to send lockout notification:', err)
                        );
                        
                        return res.status(423).json({ 
                            error: 'LOCKED', 
                            permanent: true,
                            message: 'Your account has been permanently locked due to too many failed login attempts. Please contact an administrator.'
                        });
                    } else {
                        updateFields.$set.lockoutExpiresAt = expiresAt;
                        updateFields.$inc.tokenVersion = 1; // Revoke all existing tokens
                        
                        await User.findByIdAndUpdate(user._id, updateFields);
                        
                        // Send lockout notification
                        sendLockoutNotification(user.email, user.username, false, expiresAt.toISOString()).catch(err => 
                            console.error('Failed to send lockout notification:', err)
                        );
                        
                        const remainingSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
                        res.set('Retry-After', Math.ceil(remainingSec));
                        return res.status(423).json({
                            error: 'LOCKED',
                            until: expiresAt.toISOString(),
                            remainingSeconds: remainingSec,
                            permanent: false,
                            message: `Too many failed login attempts. Your account is locked temporarily.`
                        });
                    }
                }
            }

            await User.findByIdAndUpdate(user._id, updateFields);
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        // Success: Reset all lockout counters atomically
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $set: {
                    consecutiveFailedLoginAttempts: 0,
                    lockoutStage: 0,
                    lockoutExpiresAt: null,
                    isPermanentlyLocked: false,
                    lastLoginAt: new Date()
                }
            },
            { new: true }
        );

        const tokenVersion = updatedUser.tokenVersion || 0;
        const tokenPayload = {
            sub: user._id.toString(),
            role: user.role,
            tv: tokenVersion
        };

        const accessToken = jwt.sign(
            tokenPayload,
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: '15m'
            }
        );

        const refreshToken = jwt.sign(
            tokenPayload,
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.cookie("refreshToken", refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000));
        res.cookie("accessToken", accessToken, buildCookieOptions(15 * 60 * 1000));

        return res.status(200).json({
            ok: true,
            message: "User logged in successfully",
            role: user.role,
            email: user.email,
            name: user.username,
            profilePicture: user.profilePicture,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role,
                profilePicture: user.profilePicture
            },
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) 
    {
        return res.status(401).json({ error: 'Refresh token not found' });
    }
    try 
    {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const userId = decoded.sub || decoded.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check token revocation
        const tokenVersion = typeof decoded.tv === 'number' ? decoded.tv : 0;
        const dbVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
        if (tokenVersion !== dbVersion) {
            return res.status(401).json({ error: 'TOKEN_REVOKED' });
        }

        // Check if account is locked
        if (user.isPermanentlyLocked) {
            return res.status(423).json({ 
                error: 'LOCKED', 
                permanent: true,
                message: 'Your account has been permanently locked.'
            });
        }

        const lockStatus = remainingLockout(user);
        if (lockStatus && lockStatus.remainingSeconds > 0) {
            res.set('Retry-After', Math.ceil(lockStatus.remainingSeconds));
            return res.status(423).json({
                error: 'LOCKED',
                until: user.lockoutExpiresAt.toISOString(),
                remainingSeconds: lockStatus.remainingSeconds,
                permanent: false,
                message: 'Your account is temporarily locked.'
            });
        }

        const newAccessToken = jwt.sign(
            {
                sub: user._id.toString(),
                role: user.role,
                tv: dbVersion
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            {
                expiresIn: '15m'
            }
        );

        res.cookie("accessToken", newAccessToken, buildCookieOptions(15 * 60 * 1000));

        return res.status(200).json({
            message: "Token refreshed successfully",
            role: user.role,
            email: user.email,
            name: user.username,
            profilePicture: user.profilePicture,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role,
                profilePicture: user.profilePicture
            },
        });
    } 
    catch (error) 
    {
        console.error('Error verifying refresh token:', error);
        return res.status(401).json({ error: 'Invalid refresh token' });
    } 
};

export const logout = async (req, res) => {
    try {
        const clearOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
        };

        if (process.env.COOKIE_DOMAIN) {
            clearOptions.domain = process.env.COOKIE_DOMAIN;
        }

        res.clearCookie('refreshToken', clearOptions);
        res.clearCookie('accessToken', clearOptions);
        return res.status(200).json({
            message: "User logged out successfully", 
        });
    }
    catch (error) {
        console.error('Error logging out user:', error);
        return res.status(500).json({ error: error.message });
    }
};
