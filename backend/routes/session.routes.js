import express from 'express';
import { startSession, endSession } from '../controllers/session.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();
router.post('/start', auth, startSession);
router.post('/end/:sessionId', auth, endSession);

export default router;
