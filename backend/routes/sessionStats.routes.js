
import express from 'express';
import { getSessionStats, generateStatsForSession } from '../controllers/sessionStats.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/:sessionId', auth, getSessionStats);
router.post('/generate/:sessionId', auth, generateStatsForSession);

export default router;
