import express from 'express';
import {
  createQuizResult,
  getQuizResultsByUser,
  getAllQuizResults,
  getQuizResultById,
  updateQuizResult,
  deleteQuizResult,
  getQuizStatistics
} from '../controllers/quizResult.controller.js';

const router = express.Router();

// Create a new quiz result
router.post('/', createQuizResult);

// Get all quiz results for a specific user
router.get('/user/:userId', getQuizResultsByUser);

// Get quiz statistics for a user
router.get('/user/:userId/stats', getQuizStatistics);

// Get all quiz results (admin)
router.get('/', getAllQuizResults);

// Get a specific quiz result by ID
router.get('/:id', getQuizResultById);

// Update a quiz result
router.put('/:id', updateQuizResult);

// Delete a quiz result
router.delete('/:id', deleteQuizResult);

export default router;
