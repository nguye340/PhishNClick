import express from 'express';
import { getSessionStats, generateStatsForSession, saveSessionStats } from '../controllers/sessionStats.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/:sessionId', getSessionStats);
router.post('/', saveSessionStats); // No auth required for telemetry
router.post('/generate/:sessionId', auth, generateStatsForSession);

export default router;
