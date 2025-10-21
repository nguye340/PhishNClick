import express from 'express';
import { register, login, logout, refreshToken } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh", refreshToken);

export default router;