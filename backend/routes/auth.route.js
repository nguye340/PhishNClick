import express from 'express';
import { register, login, logout, refreshToken } from '../controllers/auth.controller.js';
import { googleCallback, githubCallback } from '../controllers/oauth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh", refreshToken);

// OAuth routes
router.get("/google/callback", googleCallback);
router.get("/github/callback", githubCallback);

export default router;