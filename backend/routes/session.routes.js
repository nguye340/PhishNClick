import express from 'express';
import { startSession, endSession } from '../controllers/session.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();
router.post('/start', startSession); // No auth required for telemetry
router.post('/end/:sessionId', endSession); // No auth required for telemetry

export default router;
