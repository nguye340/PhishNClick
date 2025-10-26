import express from 'express';
import { 
  logEvent, 
  logEventsBatch, 
  getUserEvents, 
  getUserMetrics, 
  clearUserEvents 
} from '../controllers/telemetry.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Log single event
router.post('/event', logEvent);

// Log multiple events in batch
router.post('/events/batch', logEventsBatch);

// Get all events for authenticated user
router.get('/events', getUserEvents);

// Get aggregated metrics for authenticated user
router.get('/metrics', getUserMetrics);

// Clear all events for authenticated user
router.delete('/events', clearUserEvents);

export default router;
