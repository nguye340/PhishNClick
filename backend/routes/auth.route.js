import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, refreshToken } from '../controllers/auth.controller.js';
import { googleCallback, githubCallback } from '../controllers/oauth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter for login endpoint: 5 attempts per minute per IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per window
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests
    // Remove custom keyGenerator - uses default which handles IPv6 correctly
    handler: (req, res) => {
        const retryAfter = Math.ceil(60); // 1 minute in seconds
        res.set('Retry-After', retryAfter);
        res.status(429).json({ 
            error: 'RATE_LIMITED',
            message: 'Too many login attempts. Please try again later.',
            retryAfter: retryAfter
        });
    }
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/refresh", refreshToken);

// OAuth routes
router.get("/google/callback", googleCallback);
router.get("/github/callback", githubCallback);

export default router;