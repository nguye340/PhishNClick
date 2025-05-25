import express from 'express';
import { recordPopupEvent, getEventsBySession } from '../controllers/popupEvent.controller.js';
import auth from '../middleware/auth.js';
const router = express.Router();

router.post('/', auth, recordPopupEvent);
router.get('/session/:sessionId', auth, getEventsBySession);

export default router;
