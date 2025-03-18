import { Router } from 'express';
import authController from '../controllers/auth-controller';
import { loginValidationRules, userValidationRules, validateInput } from '../middleware/validateInput';
import { authenticate } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', loginValidationRules(), validateInput, asyncHandler(authController.login));

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', userValidationRules(), validateInput, asyncHandler(authController.register));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(authController.getProfile));

export default router;