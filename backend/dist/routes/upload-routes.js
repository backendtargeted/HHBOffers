"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = __importDefault(require("../controllers/upload-controller"));
const upload_middleware_1 = __importStar(require("../middleware/upload-middleware"));
const auth_middleware_1 = require("../middleware/auth-middleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/upload
 * @desc    Upload a CSV or XLSX file
 * @access  Private - Admin, Manager
 */
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['admin', 'manager']), upload_middleware_1.default.single('file'), upload_middleware_1.handleUploadErrors, (0, asyncHandler_1.asyncHandler)(upload_controller_1.default.uploadFile));
/**
 * @route   GET /api/upload/jobs
 * @desc    Get user's upload jobs
 * @access  Private
 */
router.get('/jobs', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(upload_controller_1.default.getUserJobs));
/**
 * @route   GET /api/upload/:jobId
 * @desc    Get upload job status
 * @access  Private
 */
router.get('/:jobId', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(upload_controller_1.default.getJobStatus));
/**
 * @route   PUT /api/upload/:jobId/cancel
 * @desc    Cancel an upload job
 * @access  Private
 */
router.put('/:jobId/cancel', auth_middleware_1.authenticate, (0, asyncHandler_1.asyncHandler)(upload_controller_1.default.cancelJob));
exports.default = router;
