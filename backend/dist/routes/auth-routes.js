"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth-controller"));
const validateInput_1 = require("../middleware/validateInput");
const auth_middleware_1 = require("../middleware/auth-middleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', (0, validateInput_1.loginValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.login));
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', (0, validateInput_1.userValidationRules)(), validateInput_1.validateInput, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.register));
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.logout));
/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.getProfile));
exports.default = router;
