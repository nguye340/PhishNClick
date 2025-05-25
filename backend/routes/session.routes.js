import express from 'express';
import sessionController from '../controllers/session.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.post('/start', auth, sessionController.startSession);
router.post('/end/:sessionId', auth, sessionController.endSession);

export default router;
