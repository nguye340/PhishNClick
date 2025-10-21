import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
        if (!user) 
        {
            return res.status(401).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) 
        {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const accessToken = jwt.sign(
            {
            id: user._id,
            email: user.email,
            role: user.role
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            {
                expiresIn: '15m'
            }
        );

        const refreshToken = jwt.sign(
            {
            id: user._id,
            email: user.email,
            role: user.role
            }, 
            process.env.REFRESH_TOKEN_SECRET, 
            {
                expiresIn: '7d'
            }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        return res.status(200).json({
            message: "User logged in successfully",
            role: user.role,
            email: user.email,
            name: user.username,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
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
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const newAccessToken = jwt.sign(
            {
            id: user._id,
            email: user.email,
            role: user.role
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            {
                expiresIn: '15m'
            }
        );

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            role: user.role,
            email: user.email,
            name: user.username,
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
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
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
        });
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
        });
        return res.status(200).json({
            message: "User logged out successfully", 
        });
    }
    catch (error) {
        console.error('Error logging out user:', error);
        return res.status(500).json({ error: error.message });
    }
};
