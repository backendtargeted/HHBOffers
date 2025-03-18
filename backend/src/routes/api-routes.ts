import { Router, Request, Response, NextFunction } from 'express';
import authRoutes from './auth-routes';
import propertyRoutes from './property-routes';
import uploadRoutes from './upload-routes';
import statsRoutes from './stats-routes';
import docsRoutes from './docs-routes';
import { authenticate } from '../middleware/auth-middleware';
import logger from '../logger';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    services: {
      api: 'UP',
      database: 'UP',
      redis: 'UP'
    }
  });
});

// API Documentation
router.use('/docs', docsRoutes);

// Routes
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/upload', uploadRoutes);
router.use('/stats', statsRoutes);

// 404 handler for API routes
router.use('*', (_req: Request, res: Response) => {
  logger.warn(`404 - Not Found: ${_req.originalUrl}`);
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

export default router;