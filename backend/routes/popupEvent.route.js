import express from 'express';
import { recordPopupEvent, getEventsBySession } from '../controllers/popupEvent.controller.js';
import auth from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/', recordPopupEvent); // No auth required for telemetry
router.get('/session/:sessionId', auth, getEventsBySession); // Keep auth for reading data

export default router;
