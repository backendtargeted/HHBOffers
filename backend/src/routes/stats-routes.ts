import { Router } from 'express';
import statsController from '../controllers/stats-controller';
import { authenticate, authorize } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   GET /api/stats/system
 * @desc    Get system-wide statistics
 * @access  Private
 */
router.get('/system', authenticate, asyncHandler(statsController.getSystemStats));

/**
 * @route   GET /api/stats/properties/by-state
 * @desc    Get property statistics by state
 * @access  Private
 */
router.get('/properties/by-state', authenticate, asyncHandler(statsController.getPropertyStatsByState));

/**
 * @route   GET /api/stats/properties/by-city/:state
 * @desc    Get property statistics by city for a specific state
 * @access  Private
 */
router.get('/properties/by-city/:state', authenticate, asyncHandler(statsController.getPropertyStatsByCity));

/**
 * @route   GET /api/stats/users/activity
 * @desc    Get user activity statistics
 * @access  Private - Admin only
 */
router.get(
  '/users/activity',
  authenticate,
  authorize(['admin']),
  asyncHandler(statsController.getUserActivityStats)
);

export default router;