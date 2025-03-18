import { Router } from 'express';
import uploadController from '../controllers/upload-controller';
import upload, { handleUploadErrors } from '../middleware/upload-middleware';
import { authenticate, authorize } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a CSV or XLSX file
 * @access  Private - Admin, Manager
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  upload.single('file'),
  handleUploadErrors,
  asyncHandler(uploadController.uploadFile)
);

/**
 * @route   GET /api/upload/jobs
 * @desc    Get user's upload jobs
 * @access  Private
 */
router.get(
  '/jobs',
  authenticate,
  asyncHandler(uploadController.getUserJobs)
);

/**
 * @route   GET /api/upload/:jobId
 * @desc    Get upload job status
 * @access  Private
 */
router.get(
  '/:jobId',
  authenticate,
  asyncHandler(uploadController.getJobStatus)
);

/**
 * @route   PUT /api/upload/:jobId/cancel
 * @desc    Cancel an upload job
 * @access  Private
 */
router.put(
  '/:jobId/cancel',
  authenticate,
  asyncHandler(uploadController.cancelJob)
);

export default router;