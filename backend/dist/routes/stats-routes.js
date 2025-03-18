"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = __importDefault(require("../controllers/stats-controller"));
const auth_middleware_1 = require("../middleware/auth-middleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/stats/system
 * @desc    Get system-wide statistics
 * @access  Private
 */
router.get('/system', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getSystemStats));
/**
 * @route   GET /api/stats/properties/by-state
 * @desc    Get property statistics by state
 * @access  Private
 */
router.get('/properties/by-state', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getPropertyStatsByState));
/**
 * @route   GET /api/stats/properties/by-city/:state
 * @desc    Get property statistics by city for a specific state
 * @access  Private
 */
router.get('/properties/by-city/:state', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getPropertyStatsByCity));
/**
 * @route   GET /api/stats/users/activity
 * @desc    Get user activity statistics
 * @access  Private - Admin only
 */
router.get('/users/activity', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin']), (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getUserActivityStats));
exports.default = router;
