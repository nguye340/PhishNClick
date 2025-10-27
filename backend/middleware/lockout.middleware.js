/**
 * Middleware to ensure user accounts are not locked
 * Blocks locked accounts from accessing protected resources
 */

import User from '../models/user.model.js';
import { remainingLockout } from '../utils/lockout.js';

/**
 * Middleware to check if user account is locked
 * Should be applied after authentication middleware
 */
export async function ensureNotLocked(req, res, next) {
    const userId = req.user?.id;
    
    // Skip check if no user authenticated
    if (!userId) {
        return next();
    }

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check permanent lock
        if (user.isPermanentlyLocked) {
            return res.status(423).json({ 
                error: 'LOCKED', 
                permanent: true,
                message: 'Your account has been permanently locked. Please contact an administrator.'
            });
        }

        // Check temporary lock
        const lockStatus = remainingLockout(user);
        if (lockStatus && lockStatus.remainingSeconds > 0) {
            res.set('Retry-After', Math.ceil(lockStatus.remainingSeconds)); // seconds
            return res.status(423).json({ 
                error: 'LOCKED', 
                permanent: false, 
                remainingSeconds: lockStatus.remainingSeconds,
                until: user.lockoutExpiresAt?.toISOString(),
                message: 'Your account is temporarily locked.'
            });
        }

        return next();
    } catch (error) {
        console.error('Error checking lockout status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
