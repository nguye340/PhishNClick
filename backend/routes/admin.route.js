import express from 'express';
import {
  getAdminOverview,
  getAllUsersWithRisk,
  getUserDetails,
  getBehaviorAnalytics,
  getOrganizationRisk,
  getTrainingEffectiveness,
  getActivityFeed,
  deleteUserByAdmin
} from '../controllers/admin.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(verifyRole('admin'));

/**
 * @route   GET /api/admin/overview
 * @desc    Get high-level KPIs and metrics
 * @access  Admin only
 */
router.get('/overview', getAdminOverview);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with risk scores (paginated, filterable)
 * @query   page, limit, sortBy, order, riskLevel
 * @access  Admin only
 */
router.get('/users', getAllUsersWithRisk);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed analytics for specific user
 * @access  Admin only
 */
router.get('/users/:userId', getUserDetails);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user and related telemetry
 * @access  Admin only
 */
router.delete('/users/:userId', deleteUserByAdmin);

/**
 * @route   GET /api/admin/analytics/behavior
 * @desc    Get behavioral analytics across organization
 * @access  Admin only
 */
router.get('/analytics/behavior', getBehaviorAnalytics);

/**
 * @route   GET /api/admin/analytics/risk
 * @desc    Get organization-wide risk assessment
 * @access  Admin only
 */
router.get('/analytics/risk', getOrganizationRisk);

/**
 * @route   GET /api/admin/analytics/training
 * @desc    Get training effectiveness metrics
 * @access  Admin only
 */
router.get('/analytics/training', getTrainingEffectiveness);

/**
 * @route   GET /api/admin/activity-feed
 * @desc    Get real-time activity feed
 * @query   limit
 * @access  Admin only
 */
router.get('/activity-feed', getActivityFeed);

export default router;
