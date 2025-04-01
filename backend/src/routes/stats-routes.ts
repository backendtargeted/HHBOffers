import { Router } from 'express';
import statsController from '../controllers/stats-controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/system', asyncHandler(statsController.getSystemStats));

router.get('/properties/by-state', asyncHandler(statsController.getPropertyStatsByState));

router.get('/properties/by-city/:state', asyncHandler(statsController.getPropertyStatsByCity));

router.get('/users/activity', asyncHandler(statsController.getUserActivityStats));

export default router;