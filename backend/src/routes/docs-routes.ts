import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';

const router = Router();

/**
 * @route   GET /api/docs
 * @desc    Swagger API documentation
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  // Temporary response until swagger is set up
  return res.status(200).json({
    message: 'API Documentation',
    endpoints: [
      { path: '/api/auth/login', method: 'POST', description: 'User login' },
      { path: '/api/auth/register', method: 'POST', description: 'User registration' },
      { path: '/api/properties', method: 'GET', description: 'Get all properties' },
      { path: '/api/properties/search', method: 'GET', description: 'Search properties' },
      { path: '/api/upload', method: 'POST', description: 'Upload file' },
      { path: '/api/stats/system', method: 'GET', description: 'Get system stats' }
    ]
  });
});


router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
  }
}));

export default router;