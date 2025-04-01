import { Router } from 'express';
import uploadController from '../controllers/upload-controller';
import upload, { handleUploadErrors } from '../middleware/upload-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/',
  upload.single('file'),
  handleUploadErrors,
  asyncHandler(uploadController.uploadFile)
);

router.get(
  '/jobs',
  asyncHandler(uploadController.getUserJobs)
);

router.get(
  '/:jobId',
  asyncHandler(uploadController.getJobStatus)
);

router.put(
  '/:jobId/cancel',
  asyncHandler(uploadController.cancelJob)
);

export default router;