import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import path from 'path';


// Load environment variables
dotenv.config();

// Import routes and middleware
import apiRoutes from './routes/api-routes';
import logger from './logger';
import testRedisConnection from './utils/redis-test';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Apply middlewares
app.use(cors({
  origin: ['http://localhost:5000', 'https://hhb-offers.q5l76g.easypanel.host'],
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API routes
app.use('/api', apiRoutes);


// Global error handler - fixed type declaration
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// Apply error handler
app.use(errorHandler);




// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve index.html for any unmatched routes (for client-side routing)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Test Redis connection on startup
  logger.info('Testing Redis connection...');
  const redisConnected = await testRedisConnection();
  
  if (redisConnected) {
    logger.info('Redis connection test successful');
  } else {
    logger.error('Redis connection test failed - application may not function correctly');
  }
});

export default app;
