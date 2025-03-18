# Merged Codebase

Generated on: 2025-03-18 13:29:59

Source directory: `D:\HHBOffers`

## Files

### merged_codebase.md

- Size: 0.0 B
- Modified: 2025-03-18 13:29:59

```md

```

### backend\.eslintrc.js

- Size: 431.0 B
- Modified: 2025-03-17 08:25:26

```js
module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
  },
};
```

### backend\.prettierrc.js

- Size: 193.0 B
- Modified: 2025-03-17 08:25:33

```js
module.exports = {
  semi: false,
  trailingComma: "all",
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: "always",
};
```

### backend\src\index.js

- Size: 44.0 B
- Modified: 2025-03-17 08:27:51

```js
"use strict";
console.log('Hello, world!');
```

> Error processing file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte

### backend\src\logger.ts

- Size: 734.0 B
- Modified: 2025-03-17 08:39:28

```ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const transport = new winston.transports.DailyRotateFile({
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  dirname: './logs',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    transport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

export default logger;
```

### backend\src\server.ts

- Size: 2.3 KB
- Modified: 2025-03-17 20:06:02

```ts
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

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
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

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Direct Mail Offer Lookup System API',
    version: '1.0.0',
    status: 'online'
  });
});

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
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
```

### backend\src\config\database.ts

- Size: 1.8 KB
- Modified: 2025-03-17 09:05:07

```ts
import { Sequelize } from 'sequelize';
import logger from '../logger';

/**
 * Database configuration with connection pooling to mitigate
 * connection failures during high traffic
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'direct_mail_dev',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
    pool: {
      max: 10,               // Maximum number of connection in pool
      min: 2,                // Minimum number of connection in pool
      acquire: 30000,        // Maximum time, in milliseconds, that pool will try to get connection before throwing error
      idle: 10000,           // Maximum time, in milliseconds, that a connection can be idle before being released
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      max: 5,                // Maximum retries
      backoffBase: 100,      // Initial backoff duration in ms
      backoffExponent: 1.1,  // Exponent to increase backoff each try
    }
  }
);

/**
 * Test the database connection and log the result
 * This runs when the module is first imported
 */
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
})();

export default sequelize;
```

### backend\src\controllers\auth-controller.ts

- Size: 5.8 KB
- Modified: 2025-03-17 18:35:14

```ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import logger from '../logger';

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
  /**
   * User login
   * @param req Request object
   * @param res Response object
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find the user by email
      const user = await userRepository.findByEmailForAuth(email);

      // If user not found or password is incorrect
      if (!user || !(await user.comparePassword(password))) {
        logger.warn(`Failed login attempt for email: ${email}`);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );

      // Update last login time
      await userRepository.updateLastLogin(user.id);

      // Log successful login
      await activityLogRepository.log({
        user_id: user.id,
        action: 'login',
        entity_type: 'auth',
        details: { email: user.email },
        ip_address: req.ip
      });

      // Return success with token and user info
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during login process'
      });
    }
  }

  /**
   * User registration
   * @param req Request object
   * @param res Response object
   */
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }

      // Create new user (password hashing is handled by User model hooks)
      const user = await userRepository.createUser({
        name,
        email,
        password,
        role: 'user'
      });

      // Log user creation
      await activityLogRepository.log({
        user_id: user.id,
        action: 'register',
        entity_type: 'user',
        entity_id: user.id.toString(),
        details: { email: user.email },
        ip_address: req.ip
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );

      // Return success with token and user info
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during registration process'
      });
    }
  }

  /**
   * User logout
   * @param req Request object
   * @param res Response object
   */
  async logout(req: Request, res: Response) {
    try {
      // Token invalidation happens on the client side
      // Here we just log the logout event
      
      // Get user from request (added by auth middleware)
      const userId = (req as any).user?.id;

      if (userId) {
        // Log logout
        await activityLogRepository.log({
          user_id: userId,
          action: 'logout',
          entity_type: 'auth',
          ip_address: req.ip
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during logout process'
      });
    }
  }

  /**
   * Get current user profile
   * @param req Request object
   * @param res Response object
   */
  async getProfile(req: Request, res: Response) {
    try {
      // Get user from request (added by auth middleware)
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Find user by ID
      const user = await userRepository.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Return user profile
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving user profile'
      });
    }
  }
}

export default new AuthController();
```

### backend\src\controllers\property-controller.ts

- Size: 21.2 KB
- Modified: 2025-03-17 18:37:35

```ts
import { Request, Response } from 'express';
import Property from '../models/Property';
import { propertyRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import { redisService } from '../services/redis-service';
import logger from '../logger';

class PropertyController {
  /**
   * Get all properties with pagination
   * @param req Request object
   * @param res Response object
   */
  async getAllProperties(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.limit as string) || 20;
      
      // Cache key based on query parameters
      const cacheKey = `properties:all:page=${page}:limit=${pageSize}`;
      
      // Try to get from cache first
      const cachedData = await redisService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          ...cachedData,
          fromCache: true
        });
      }
      
      // If not in cache, get from database
      const result = await propertyRepository.findPaginated(page, pageSize);
      
      // Store in cache for 5 minutes
      await redisService.set(cacheKey, result, 300);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error fetching properties:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching properties'
      });
    }
  }

  /**
   * Get property by ID
   * @param req Request object
   * @param res Response object
   */
  async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Cache key
      const cacheKey = `property:${id}`;
      
      // Try to get from cache first
      const cachedProperty = await redisService.get(cacheKey);
      if (cachedProperty) {
        return res.status(200).json({
          success: true,
          property: cachedProperty,
          fromCache: true
        });
      }
      
      // If not in cache, get from database
      const property = await propertyRepository.findById(parseInt(id));
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Store in cache for 10 minutes
      await redisService.set(cacheKey, property, 600);
      
      // Log view activity
      const userId = (req as any).user?.id;
      if (userId) {
        await activityLogRepository.log({
          user_id: userId,
          action: 'view',
          entity_type: 'property',
          entity_id: id,
          ip_address: req.ip
        });
      }
      
      return res.status(200).json({
        success: true,
        property
      });
    } catch (error) {
      logger.error(`Error fetching property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching property'
      });
    }
  }

  /**
   * Create a new property
   * @param req Request object
   * @param res Response object
   */
  async createProperty(req: Request, res: Response) {
    try {
      const propertyData = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        property_address: req.body.propertyAddress,
        property_city: req.body.propertyCity,
        property_state: req.body.propertyState,
        property_zip: req.body.propertyZip,
        offer: req.body.offer,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Check if property with same address already exists
      const existingProperty = await propertyRepository.findByAddressCombination(
        propertyData.property_address,
        propertyData.property_city,
        propertyData.property_state,
        propertyData.property_zip
      );
      
      if (existingProperty) {
        return res.status(409).json({
          success: false,
          message: 'Property with this address already exists'
        });
      }
      
      // Create property
      const property = await propertyRepository.create(propertyData);
      
      // Log creation activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'create',
        entity_type: 'property',
        entity_id: property.id.toString(),
        details: propertyData,
        ip_address: req.ip
      });
      
      // Invalidate related cache keys
      await redisService.delete('properties:all:*');
      
      return res.status(201).json({
        success: true,
        property
      });
    } catch (error) {
      logger.error('Error creating property:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating property'
      });
    }
  }

  /**
   * Update a property
   * @param req Request object
   * @param res Response object
   */
  async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const propertyId = parseInt(id);
      
      // Check if property exists
      const existingProperty = await propertyRepository.findById(propertyId);
      
      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      const updateData: any = {};
      
      // Only include fields that are present in the request
      if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
      if (req.body.propertyAddress !== undefined) updateData.property_address = req.body.propertyAddress;
      if (req.body.propertyCity !== undefined) updateData.property_city = req.body.propertyCity;
      if (req.body.propertyState !== undefined) updateData.property_state = req.body.propertyState;
      if (req.body.propertyZip !== undefined) updateData.property_zip = req.body.propertyZip;
      if (req.body.offer !== undefined) updateData.offer = req.body.offer;
      
      // Always update the updated_at timestamp
      updateData.updated_at = new Date();
      
      // If changing address, check for duplicates
      if (updateData.property_address || updateData.property_city || 
          updateData.property_state || updateData.property_zip) {
            
        const addressToCheck = {
          property_address: updateData.property_address || existingProperty.property_address,
          property_city: updateData.property_city || existingProperty.property_city,
          property_state: updateData.property_state || existingProperty.property_state,
          property_zip: updateData.property_zip || existingProperty.property_zip
        };
        
        const duplicateProperty = await propertyRepository.findByAddressCombination(
          addressToCheck.property_address,
          addressToCheck.property_city,
          addressToCheck.property_state,
          addressToCheck.property_zip
        );
        
        if (duplicateProperty && duplicateProperty.id !== propertyId) {
          return res.status(409).json({
            success: false,
            message: 'Another property with this address already exists'
          });
        }
      }
      
      // Update property
      const [numUpdated, [updatedProperty]] = await propertyRepository.update(propertyId, updateData);
      
      if (numUpdated === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update property'
        });
      }
      
      // Log update activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'update',
        entity_type: 'property',
        entity_id: id,
        details: updateData,
        ip_address: req.ip
      });
      
      // Invalidate cache
      await redisService.delete(`property:${id}`);
      await redisService.delete('properties:all:*');
      
      return res.status(200).json({
        success: true,
        property: updatedProperty
      });
    } catch (error) {
      logger.error(`Error updating property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error updating property'
      });
    }
  }

  /**
   * Delete a property
   * @param req Request object
   * @param res Response object
   */
  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const propertyId = parseInt(id);
      
      // Check if property exists
      const existingProperty = await propertyRepository.findById(propertyId);
      
      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Delete property
      const deleted = await propertyRepository.delete(propertyId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete property'
        });
      }
      
      // Log deletion activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'delete',
        entity_type: 'property',
        entity_id: id,
        details: {
          property_address: existingProperty.property_address,
          property_city: existingProperty.property_city,
          property_state: existingProperty.property_state,
          property_zip: existingProperty.property_zip
        },
        ip_address: req.ip
      });
      
      // Invalidate cache
      await redisService.delete(`property:${id}`);
      await redisService.delete('properties:all:*');
      
      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting property'
      });
    }
  }


  /**
   * Batch update properties
   * @param req Request object
   * @param res Response object
   */
  async batchUpdateProperties(req: Request, res: Response) {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Expected an array of properties.'
        });
      }
      
      const results = {
        total: properties.length,
        updated: 0,
        failed: 0,
        errors: [] as { id: number; error: string }[]
      };
      
      const userId = (req as any).user?.id;
      
      // Process each property update
      for (const property of properties) {
        try {
          if (!property.id) {
            results.failed++;
            results.errors.push({ id: property.id || 0, error: 'Missing property ID' });
            continue;
          }
          
          const propertyId = typeof property.id === 'string' ? parseInt(property.id) : property.id;
          
          // Check if property exists
          const existingProperty = await propertyRepository.findById(propertyId);
          
          if (!existingProperty) {
            results.failed++;
            results.errors.push({ id: propertyId, error: 'Property not found' });
            continue;
          }
          
          const updateData: any = {};
          
          // Only include fields that are present in the request
          if (property.firstName !== undefined) updateData.first_name = property.firstName;
          if (property.lastName !== undefined) updateData.last_name = property.lastName;
          if (property.propertyAddress !== undefined) updateData.property_address = property.propertyAddress;
          if (property.propertyCity !== undefined) updateData.property_city = property.propertyCity;
          if (property.propertyState !== undefined) updateData.property_state = property.propertyState;
          if (property.propertyZip !== undefined) updateData.property_zip = property.propertyZip;
          if (property.offer !== undefined) updateData.offer = property.offer;
          
          // Always update the updated_at timestamp
          updateData.updated_at = new Date();
          
          // If changing address, check for duplicates
          if (updateData.property_address || updateData.property_city || 
              updateData.property_state || updateData.property_zip) {
                
            const addressToCheck = {
              property_address: updateData.property_address || existingProperty.property_address,
              property_city: updateData.property_city || existingProperty.property_city,
              property_state: updateData.property_state || existingProperty.property_state,
              property_zip: updateData.property_zip || existingProperty.property_zip
            };
            
            const duplicateProperty = await propertyRepository.findByAddressCombination(
              addressToCheck.property_address,
              addressToCheck.property_city,
              addressToCheck.property_state,
              addressToCheck.property_zip
            );
            
            if (duplicateProperty && duplicateProperty.id !== propertyId) {
              results.failed++;
              results.errors.push({ 
                id: propertyId, 
                error: 'Another property with this address already exists' 
              });
              continue;
            }
          }
          
          // Update property
          const [numUpdated, [updatedProperty]] = await propertyRepository.update(propertyId, updateData);
          
          if (numUpdated === 0) {
            results.failed++;
            results.errors.push({ id: propertyId, error: 'Failed to update property' });
            continue;
          }
          
          // Log update activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'batch_update',
            entity_type: 'property',
            entity_id: propertyId.toString(),
            details: updateData,
            ip_address: req.ip
          });
          
          // Invalidate cache
          await redisService.delete(`property:${propertyId}`);
          
          results.updated++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error updating property in batch operation:`, errorMessage);
          
          results.failed++;
          results.errors.push({ 
            id: property.id || 0, 
            error: errorMessage 
          });
        }
      }
      
      // Invalidate list caches
      await redisService.delete('properties:all:*');
      await redisService.delete('properties:search:*');
      
      return res.status(200).json({
        success: true,
        results
      });
    } catch (error) {
      logger.error('Error performing batch update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error performing batch update'
      });
    }
  }
      

  /**
   * Search properties with pagination and autocomplete functionality
   * @param req Request object
   * @param res Response object
   */
  async searchProperties(req: Request, res: Response) {
    try {
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      // If query is too short, return empty results
      if (query.length < 2) {
        return res.status(200).json({
          success: true,
          results: [],
          total: 0,
          page,
          limit
        });
      }
      
      // Cache key
      const cacheKey = `properties:search:q=${query}:page=${page}:limit=${limit}`;
      
      // Try to get from cache first
      const cachedResults = await redisService.get(cacheKey);
      if (cachedResults) {
        return res.status(200).json({
          success: true,
          ...cachedResults,
          fromCache: true
        });
      }
      
      // Get search results
      const results = await propertyRepository.searchProperties(query, limit, offset);
      const total = await propertyRepository.count({
        where: results.length > 0 ? { id: { in: results.map((p: Property) => p.id) } } : {}
      });
      
      // Format response
      const response = {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache results for 5 minutes
      await redisService.set(cacheKey, response, 300);
      
      // Log search activity
      const userId = (req as any).user?.id;
      if (userId) {
        await activityLogRepository.log({
          user_id: userId,
          action: 'search',
          entity_type: 'property',
          details: { query, page, limit, resultsCount: results.length },
          ip_address: req.ip
        });
      }
      
      return res.status(200).json({
        success: true,
        ...response
      });
    } catch (error) {
      logger.error(`Error searching properties with query ${req.query.q}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error searching properties'
      });
    }
  }

    /**
   * Batch create properties
   * @param req Request object
   * @param res Response object
   */
  async batchCreateProperties(req: Request, res: Response) {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Expected an array of properties.'
        });
      }
      
      const results = {
        total: properties.length,
        created: 0,
        failed: 0,
        errors: [] as { index: number; error: string }[]
      };
      
      const userId = (req as any).user?.id;
      const createdProperties = [];
      
      // Process each property
      for (let i = 0; i < properties.length; i++) {
        try {
          const property = properties[i];
          
          // Transform to database format
          const propertyData = {
            first_name: property.firstName || null,
            last_name: property.lastName || null,
            property_address: property.propertyAddress,
            property_city: property.propertyCity,
            property_state: property.propertyState,
            property_zip: property.propertyZip,
            offer: property.offer,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          // Check for duplicate by address
          const existingProperty = await propertyRepository.findByAddressCombination(
            propertyData.property_address,
            propertyData.property_city,
            propertyData.property_state,
            propertyData.property_zip
          );
          
          if (existingProperty) {
            results.failed++;
            results.errors.push({ 
              index: i, 
              error: 'Property with this address already exists' 
            });
            continue;
          }
          
          // Create the property
          const newProperty = await propertyRepository.create(propertyData);
          
          // Log creation
          await activityLogRepository.log({
            user_id: userId,
            action: 'batch_create',
            entity_type: 'property',
            entity_id: newProperty.id.toString(),
            details: propertyData,
            ip_address: req.ip
          });
          
          results.created++;
          createdProperties.push(newProperty);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error creating property in batch operation:`, errorMessage);
          
          results.failed++;
          results.errors.push({ index: i, error: errorMessage });
        }
      }
      
      // Invalidate list caches
      await redisService.delete('properties:all:*');
      
      return res.status(201).json({
        success: true,
        results,
        properties: createdProperties
      });
    } catch (error) {
      logger.error('Error performing batch creation:', error);
      return res.status(500).json({
        success: false,
        message: 'Error performing batch creation'
      });
    }
  }
}

export default new PropertyController();
```

### backend\src\controllers\stats-controller.ts

- Size: 7.6 KB
- Modified: 2025-03-17 19:28:08

```ts
import { Request, Response } from 'express';
import { propertyRepository, uploadJobRepository, userRepository, activityLogRepository } from '../repositories';
import { redisService } from '../services/redis-service';
import logger from '../logger';
import ActivityLog from '../models/ActivityLog';

/**
 * Controller for statistics and dashboard data
 */
class StatsController {
  /**
   * Get system overview statistics for the dashboard
   * @param req Request object
   * @param res Response object
   */
  async getSystemStats(req: Request, res: Response) {
    try {
      // Try to get from cache first
      const cacheKey = 'stats:system';
      const cachedStats = await redisService.get(cacheKey);
      
      if (cachedStats) {
        return res.status(200).json({
          success: true,
          stats: cachedStats,
          fromCache: true
        });
      }
      
      // Gather fresh statistics
      const totalUsers = await userRepository.count();
      const activeUsers = await userRepository.getActiveUserCount(7); // Active in last 7 days
      
      const totalProperties = await propertyRepository.count();
      const propertiesAddedToday = await propertyRepository.getPropertiesAddedToday();
      const propertiesUpdatedToday = await propertyRepository.getPropertiesUpdatedToday();
      
      // Get upload job statistics
      const uploadStats = await uploadJobRepository.getJobStats(30); // Last 30 days
      
      // Get recent activities
      const recentActivities = await activityLogRepository.getRecentActivity(10);
      
      // Format response
      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        properties: {
          total: totalProperties,
          addedToday: propertiesAddedToday,
          updatedToday: propertiesUpdatedToday
        },
        uploads: uploadStats,
        recentActivities: recentActivities.map((activity: ActivityLog) => ({
          id: activity.id,
          userId: activity.user_id,
          action: activity.action,
          entityType: activity.entity_type,
          entityId: activity.entity_id,
          timestamp: activity.created_at,
          details: activity.details
        }))
      };
      
      // Cache for 5 minutes
      await redisService.set(cacheKey, stats, 300);
      
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error fetching system stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching system statistics'
      });
    }
  }

  /**
   * Get property statistics by state
   * @param req Request object
   * @param res Response object
   */
  async getPropertyStatsByState(req: Request, res: Response) {
    try {
      // Try to get from cache first
      const cacheKey = 'stats:properties:byState';
      const cachedStats = await redisService.get(cacheKey);
      
      if (cachedStats) {
        return res.status(200).json({
          success: true,
          stats: cachedStats,
          fromCache: true
        });
      }
      
      // Get statistics by state
      const statsByState = await propertyRepository.getStatsByState();
      
      // Cache for 1 hour
      await redisService.set(cacheKey, statsByState, 3600);
      
      return res.status(200).json({
        success: true,
        stats: statsByState
      });
    } catch (error) {
      logger.error('Error fetching property stats by state:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching property statistics by state'
      });
    }
  }

  /**
   * Get property statistics by city for a specific state
   * @param req Request object
   * @param res Response object
   */
  async getPropertyStatsByCity(req: Request, res: Response) {
    try {
      const { state } = req.params;
      
      if (!state || state.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state code. Must be a 2-letter state code.'
        });
      }
      
      // Try to get from cache first
      const cacheKey = `stats:properties:byCity:${state.toUpperCase()}`;
      const cachedStats = await redisService.get(cacheKey);
      
      if (cachedStats) {
        return res.status(200).json({
          success: true,
          stats: cachedStats,
          fromCache: true
        });
      }
      
      // Get statistics by city for the given state
      const statsByCity = await propertyRepository.getStatsByCity(state);
      
      // Cache for 1 hour
      await redisService.set(cacheKey, statsByCity, 3600);
      
      return res.status(200).json({
        success: true,
        stats: statsByCity
      });
    } catch (error) {
      logger.error(`Error fetching property stats by city for state ${req.params.state}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching property statistics by city'
      });
    }
  }

  /**
   * Get user activity statistics
   * @param req Request object
   * @param res Response object
   */
  async getUserActivityStats(req: Request, res: Response) {
    try {
      // Try to get from cache first
      const cacheKey = 'stats:userActivity';
      const cachedStats = await redisService.get(cacheKey);
      
      if (cachedStats) {
        return res.status(200).json({
          success: true,
          stats: cachedStats,
          fromCache: true
        });
      }
      
      // Get users with upload counts
      const usersWithUploads = await userRepository.getUsersWithUploadCounts();
      
      // Get user activity counts by type
      const activityCounts = await activityLogRepository.getActivityCountsByUser();
      
      // Format response
      const stats = {
        usersWithUploads,
        activityCounts
      };
      
      // Cache for 1 hour
      await redisService.set(cacheKey, stats, 3600);
      
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error fetching user activity stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user activity statistics'
      });
    }
  }

  /**
   * Get upload statistics for the dashboard
   * @param req Request object
   * @param res Response object
   */
  async getUploadStats(req: Request, res: Response) {
    try {
      // Get days parameter (default to 30)
      const days = parseInt(req.query.days as string) || 30;
      
      // Try to get from cache first
      const cacheKey = `stats:uploads:${days}`;
      const cachedStats = await redisService.get(cacheKey);
      
      if (cachedStats) {
        return res.status(200).json({
          success: true,
          stats: cachedStats,
          fromCache: true
        });
      }
      
      // Get upload statistics
      const stats = await uploadJobRepository.getJobStats(days);
      
      // Cache for 30 minutes
      await redisService.set(cacheKey, stats, 1800);
      
      return res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error fetching upload stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching upload statistics'
      });
    }
  }
}

export default new StatsController();
```

### backend\src\controllers\upload-controller.ts

- Size: 9.4 KB
- Modified: 2025-03-17 10:57:24

```ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { uploadJobRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import FileProcessorService from '../services/FileProcessorService';
import logger from '../logger';

// Initialize file processor service
const fileProcessorService = new FileProcessorService();

class UploadController {
  /**
   * Upload a file (CSV or XLSX)
   * @param req Request object
   * @param res Response object
   */
  async uploadFile(req: Request, res: Response) {
    try {
      // Check if file exists in request
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Get file details
      const file = req.file;
      const userId = (req as any).user.id;
      const originalName = file.originalname;
      const fileSize = file.size;
      const filePath = file.path;
      
      // Determine file type based on extension
      const fileExtension = path.extname(originalName).toLowerCase();
      let fileType = '';
      
      if (fileExtension === '.csv') {
        fileType = 'csv';
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        fileType = 'xlsx';
      } else {
        // Delete the uploaded file if it's not a supported type
        fs.unlinkSync(filePath);
        
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Only CSV and Excel files are allowed.'
        });
      }
      
      // Generate a unique job ID
      const jobId = uuidv4();
      
      // Create an upload job record
      const job = await uploadJobRepository.createJob({
        id: jobId,
        user_id: userId,
        filename: originalName,
        file_type: fileType,
        status: 'pending',
        total_records: 0,
        new_records: 0,
        updated_records: 0,
        error_records: 0
      });
      
      // Log the upload activity
      await activityLogRepository.log({
        user_id: userId,
        action: 'upload',
        entity_type: 'uploadjob',
        entity_id: jobId,
        details: {
          filename: originalName,
          fileSize,
          fileType
        },
        ip_address: req.ip
      });
      
      // Start processing in the background
      this.processFileInBackground(filePath, fileType, jobId, userId);
      
      // Return response immediately with job ID
      return res.status(202).json({
        success: true,
        jobId,
        message: 'File upload started. You can check the status using the job ID.'
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading file'
      });
    }
  }
  
  /**
   * Process file in the background
   * @param filePath Path to the uploaded file
   * @param fileType Type of file (csv or xlsx)
   * @param jobId Unique job ID
   * @param userId User ID
   */
  private async processFileInBackground(
    filePath: string,
    fileType: string,
    jobId: string,
    userId: number
  ) {
    try {
      // Process the file based on type
      if (fileType === 'csv') {
        await fileProcessorService.processCsvFile(filePath, jobId, userId);
      } else if (fileType === 'xlsx') {
        await fileProcessorService.processXlsxFile(filePath, jobId, userId);
      }
      
      // Move file to processed directory
      const fileName = path.basename(filePath);
      const processedDir = path.join(path.dirname(path.dirname(filePath)), 'processed');
      
      // Ensure processed directory exists
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }
      
      const processedFilePath = path.join(processedDir, fileName);
      
      fs.renameSync(filePath, processedFilePath);
      
      logger.info(`File ${fileName} processed successfully and moved to ${processedFilePath}`);
    } catch (error) {
      logger.error(`Error processing file for job ${jobId}:`, error);
      
      // Update job status to failed
      await uploadJobRepository.updateStatus(jobId, 'failed');
      
      // Log error
      await activityLogRepository.log({
        user_id: userId,
        action: 'upload_failed',
        entity_type: 'uploadjob',
        entity_id: jobId,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      // Try to delete the file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (deleteError) {
        logger.error(`Error deleting file ${filePath}:`, deleteError);
      }
    }
  }
  
  /**
   * Get job status
   * @param req Request object
   * @param res Response object
   */
  async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      // Get job from database
      const job = await uploadJobRepository.findById(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check if user has permission to view this job
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      
      if (job.user_id !== userId && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this job'
        });
      }
      
      // Return job status
      return res.status(200).json({
        success: true,
        job: {
          id: job.id,
          filename: job.filename,
          status: job.status,
          progress: job.total_records > 0 
            ? Math.round(((job.new_records + job.updated_records + job.error_records) / job.total_records) * 100) 
            : 0,
          totalRecords: job.total_records,
          processedRecords: job.new_records + job.updated_records + job.error_records,
          newRecords: job.new_records,
          updatedRecords: job.updated_records,
          errorRecords: job.error_records,
          createdAt: job.created_at,
          completedAt: job.completed_at
        }
      });
    } catch (error) {
      logger.error(`Error fetching job status for job ${req.params.jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching job status'
      });
    }
  }
  
  /**
   * Cancel a job
   * @param req Request object
   * @param res Response object
   */
  async cancelJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      // Get job from database
      const job = await uploadJobRepository.findById(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check if user has permission to cancel this job
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      
      if (job.user_id !== userId && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this job'
        });
      }
      
      // Check if job can be cancelled
      if (job.status !== 'pending' && job.status !== 'processing') {
        return res.status(400).json({
          success: false,
          message: `Job cannot be cancelled because it is already ${job.status}`
        });
      }
      
      // Cancel the job
      await uploadJobRepository.cancelJob(jobId);
      
      // Log cancellation
      await activityLogRepository.log({
        user_id: userId,
        action: 'cancel_upload',
        entity_type: 'uploadjob',
        entity_id: jobId,
        ip_address: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } catch (error) {
      logger.error(`Error cancelling job ${req.params.jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error cancelling job'
      });
    }
  }
  
  /**
   * Get recent jobs for the current user
   * @param req Request object
   * @param res Response object
   */
  async getUserJobs(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get jobs from database
      const result = await uploadJobRepository.findByUserId(userId, page, limit);
      
      return res.status(200).json({
        success: true,
        jobs: result.rows,
        total: result.count,
        page: result.currentPage,
        totalPages: result.totalPages
      });
    } catch (error) {
      logger.error('Error fetching user jobs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user jobs'
      });
    }
  }
}

export default new UploadController();
```

### backend\src\middleware\auth-middleware.ts

- Size: 2.9 KB
- Modified: 2025-03-17 19:19:10

```ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories';
import logger from '../logger';
import { asyncHandler } from '../utils/asyncHandler';

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to authenticate user via JWT token
 */
export const authenticate: RequestHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Extract token
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Find user by ID from token
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User not found'
      });
    }

    // Attach user to request for use in other middlewares and route handlers
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token verification failed', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
});

/**
 * Middleware to authorize user by role
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
export const authorize = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists (should be attached by authenticate middleware)
    if (!(req as any).user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if user has required role
    const userRole = (req as any).user.role;
    
    if (!roles.includes(userRole)) {
      logger.warn(`Authorization failed for user ${(req as any).user.id}: Role ${userRole} not in ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    }

    next();
  };
};
```

### backend\src\middleware\upload-middleware.ts

- Size: 2.7 KB
- Modified: 2025-03-17 10:58:03

```ts
import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// Define upload directories
const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(uploadDir, 'temp');
const processedDir = path.join(uploadDir, 'processed');

// Ensure directories exist
[uploadDir, tempDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniquePrefix = uuidv4();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Check file type
  const allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Also check by extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Middleware for handling file upload errors
export const handleUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 50MB limit'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file can be uploaded at a time'
      });
    }
    
    logger.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  } else if (err) {
    // Non-Multer error
    logger.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};

export default upload;
```

### backend\src\middleware\validateInput.ts

- Size: 6.6 KB
- Modified: 2025-03-17 19:19:40

```ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, body, param, query, ValidationChain } from 'express-validator';
import logger from '../logger';

/**
 * Express middleware for input validation and sanitization
 * This helps prevent SQL injection and other input-based attacks
 */
export const validateInput: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

/**
 * Property search validation rules
 * Used for autocomplete and search endpoints
 */
export const searchValidationRules = (): ValidationChain[] => [
  // Sanitize the search query parameter
  query('q').trim().escape(),
  
  // Validate and convert pagination parameters
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  
  // Validate sorting parameters
  query('sortBy').optional().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']).trim()
];

/**
 * Property validation rules
 * Used for property creation and update endpoints
 */
export const propertyValidationRules = (): ValidationChain[] => [
  // Optional name fields
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  
  // Required property fields with appropriate sanitization
  body('propertyAddress').notEmpty().trim().escape()
    .withMessage('Property address is required'),
    
  body('propertyCity').notEmpty().trim().escape()
    .withMessage('Property city is required'),
    
  body('propertyState').notEmpty().isLength({ min: 2, max: 2 }).trim().escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('propertyZip').notEmpty().trim().escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('offer').isNumeric().toFloat()
    .withMessage('Offer must be a valid number')
];

/**
 * File upload validation rules
 * Used for file upload endpoints
 */
export const fileUploadValidationRules = (): ValidationChain[] => [
  // Ensure fileType is either csv or xlsx
  body('fileType').notEmpty().isIn(['csv', 'xlsx'])
    .withMessage('File type must be csv or xlsx')
];

/**
 * User creation validation rules
 * Used for user registration endpoint
 */
export const userValidationRules = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail()
    .withMessage('Must be a valid email address'),
    
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    
  body('name').notEmpty().trim().escape()
    .withMessage('Name is required'),
    
  body('role').optional().isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
];

/**
 * Login validation rules
 * Used for the login endpoint
 */
export const loginValidationRules = (): ValidationChain[] => [
  body('email').isEmail().normalizeEmail()
    .withMessage('Must be a valid email address'),
    
  body('password').notEmpty()
    .withMessage('Password is required')
];

/**
 * Batch property update validation rules
 */
export const batchPropertyValidationRules = (): ValidationChain[] => [
  body('properties')
    .isArray()
    .withMessage('Properties must be an array')
    .notEmpty()
    .withMessage('Properties array cannot be empty'),
  
  body('properties.*.id')
    .exists()
    .withMessage('Each property must have an ID')
    .isInt()
    .withMessage('Property ID must be an integer'),
  
  body('properties.*.propertyAddress')
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property address cannot be empty if provided'),
    
  body('properties.*.propertyCity')
    .optional()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property city cannot be empty if provided'),
    
  body('properties.*.propertyState')
    .optional()
    .isLength({ min: 2, max: 2 })
    .trim()
    .escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('properties.*.propertyZip')
    .optional()
    .trim()
    .escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('properties.*.offer')
    .optional()
    .isNumeric()
    .withMessage('Offer must be a valid number')
];


/**
 * Batch property creation validation rules
 */
export const batchPropertyCreationRules = (): ValidationChain[] => [
  body('properties')
    .isArray()
    .withMessage('Properties must be an array')
    .notEmpty()
    .withMessage('Properties array cannot be empty'),
  
  body('properties.*.propertyAddress')
    .exists()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property address is required'),
    
  body('properties.*.propertyCity')
    .exists()
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Property city is required'),
    
  body('properties.*.propertyState')
    .exists()
    .isLength({ min: 2, max: 2 })
    .trim()
    .escape()
    .withMessage('Property state must be a valid 2-letter state code'),
    
  body('properties.*.propertyZip')
    .exists()
    .trim()
    .escape()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Property zip must be a valid 5-digit or 5+4-digit ZIP code'),
    
  body('properties.*.offer')
    .exists()
    .isNumeric()
    .withMessage('Offer must be a valid number')
];

// Example usage in route definitions:
// app.get('/api/properties/search', searchValidationRules(), validateInput, searchController.autocomplete);
// app.post('/api/properties', propertyValidationRules(), validateInput, propertiesController.create);
// app.post('/api/uploads', fileUploadValidationRules(), validateInput, uploadsController.upload);
// app.post('/api/users', userValidationRules(), validateInput, usersController.create);
// app.post('/api/auth/login', loginValidationRules(), validateInput, authController.login);
```

### backend\src\models\ActivityLog.ts

- Size: 3.9 KB
- Modified: 2025-03-17 09:42:26

```ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// ActivityLog attributes interface
export interface ActivityLogAttributes {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: object; // JSON data
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Attributes for ActivityLog creation - id and timestamps are optional
export interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'created_at' | 'user_id' | 'entity_id' | 'details' | 'ip_address' | 'user_agent'> {}

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public user_id?: number;
  public action!: string;
  public entity_type!: string;
  public entity_id?: string;
  public details?: object;
  public ip_address?: string;
  public user_agent?: string;
  public created_at!: Date;

  // Helper method to get activity type categorization 
  public getActivityCategory(): 'data' | 'auth' | 'upload' | 'system' | 'other' {
    // Categorize activity based on action and entity_type
    if (['create', 'update', 'delete', 'view'].includes(this.action.toLowerCase()) && 
        ['property', 'user'].includes(this.entity_type.toLowerCase())) {
      return 'data';
    } else if (['login', 'logout', 'register', 'password_reset'].includes(this.action.toLowerCase())) {
      return 'auth';
    } else if (this.entity_type.toLowerCase() === 'uploadjob') {
      return 'upload';
    } else if (['system', 'config', 'maintenance'].includes(this.entity_type.toLowerCase())) {
      return 'system';
    } else {
      return 'other';
    }
  }
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    entity_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'audit_logs', // Match the table name in the database schema
    timestamps: false, // We'll only use created_at
    indexes: [
      {
        name: 'idx_activity_logs_user',
        fields: ['user_id'],
      },
      {
        name: 'idx_activity_logs_entity',
        fields: ['entity_type', 'entity_id'],
      },
      {
        name: 'idx_activity_logs_action',
        fields: ['action'],
      },
      {
        name: 'idx_activity_logs_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

// Set up the association with the User model
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

/**
 * Static method to log activity - makes it easier to create new log entries
 */
export const logActivity = async (params: {
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: object;
  ip_address?: string;
  user_agent?: string;
}): Promise<ActivityLog> => {
  return await ActivityLog.create({
    ...params,
    created_at: new Date(),
  });
};

export default ActivityLog;
```

### backend\src\models\Property.ts

- Size: 3.4 KB
- Modified: 2025-03-17 09:41:37

```ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Property attributes interface
export interface PropertyAttributes {
  id: number;
  first_name?: string;
  last_name?: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  offer: number;
  created_at: Date;
  updated_at: Date;
}

// Attributes for Property creation - id and timestamps are optional
export interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'created_at' | 'updated_at' | 'first_name' | 'last_name'> {}

class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: number;
  public first_name?: string;
  public last_name?: string;
  public property_address!: string;
  public property_city!: string;
  public property_state!: string;
  public property_zip!: string;
  public offer!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Property.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    property_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    property_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    property_state: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      validate: {
        notEmpty: true,
        isUppercase: true,
        isIn: [['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
                'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
                'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
                'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 
                'DC', 'PR', 'VI', 'AA', 'AE', 'AP']], // Valid US state/territory codes
      },
    },
    property_zip: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[0-9]{5}(-[0-9]{4})?$/, // 5 digit or 5+4 format
      },
    },
    offer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0, // Offer cannot be negative
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Property',
    tableName: 'properties',
    timestamps: false, // We'll manually manage created_at and updated_at
    indexes: [
      {
        // Match the index in the DB schema
        name: 'idx_properties_address',
        fields: ['property_address', 'property_city', 'property_state', 'property_zip'],
      },
    ],
    hooks: {
      beforeUpdate: (property: Property) => {
        property.updated_at = new Date();
      },
    },
  }
);

export default Property;
```

### backend\src\models\UploadJob.ts

- Size: 5.0 KB
- Modified: 2025-03-17 09:42:04

```ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// UploadJob attributes interface
export interface UploadJobAttributes {
  id: string; // UUID
  user_id: number;
  filename: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_records: number;
  new_records: number;
  updated_records: number;
  error_records: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// Attributes for UploadJob creation - id, timestamps, and default values are optional
export interface UploadJobCreationAttributes extends Optional<UploadJobAttributes, 
  'id' | 'created_at' | 'updated_at' | 'completed_at' | 
  'total_records' | 'new_records' | 'updated_records' | 'error_records'> {}

class UploadJob extends Model<UploadJobAttributes, UploadJobCreationAttributes> implements UploadJobAttributes {
  public id!: string;
  public user_id!: number;
  public filename!: string;
  public file_type!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  public total_records!: number;
  public new_records!: number;
  public updated_records!: number;
  public error_records!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public completed_at?: Date;

  // Virtual field for calculating processing time
  public get processingTime(): number | null {
    if (!this.completed_at) return null;
    return Math.floor((this.completed_at.getTime() - this.created_at.getTime()) / 1000); // in seconds
  }

  // Virtual field for calculating success rate
  public get successRate(): number {
    if (this.total_records === 0) return 0;
    return ((this.new_records + this.updated_records) / this.total_records) * 100;
  }

  // Method to update job progress
  public async updateProgress(stats: {
    totalRecords?: number;
    newRecords?: number;
    updatedRecords?: number;
    errorRecords?: number;
  }): Promise<UploadJob> {
    if (stats.totalRecords !== undefined) this.total_records = stats.totalRecords;
    if (stats.newRecords !== undefined) this.new_records = stats.newRecords;
    if (stats.updatedRecords !== undefined) this.updated_records = stats.updatedRecords;
    if (stats.errorRecords !== undefined) this.error_records = stats.errorRecords;
    
    await this.save();
    return this;
  }

  // Method to mark job as completed
  public async markAsCompleted(): Promise<UploadJob> {
    this.status = 'completed';
    this.completed_at = new Date();
    await this.save();
    return this;
  }

  // Method to mark job as failed
  public async markAsFailed(): Promise<UploadJob> {
    this.status = 'failed';
    this.completed_at = new Date();
    await this.save();
    return this;
  }

  // Method to cancel the job
  public async cancel(): Promise<UploadJob> {
    this.status = 'cancelled';
    this.completed_at = new Date();
    await this.save();
    return this;
  }
}

UploadJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    file_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['csv', 'xlsx']],
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'completed', 'failed', 'cancelled']],
      },
    },
    total_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    new_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    updated_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    error_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UploadJob',
    tableName: 'upload_jobs',
    timestamps: false, // We'll manually manage created_at and updated_at
    hooks: {
      beforeUpdate: (uploadJob: UploadJob) => {
        uploadJob.updated_at = new Date();
      },
    },
  }
);

// Set up the association with the User model
UploadJob.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UploadJob;
```

### backend\src\models\User.ts

- Size: 3.0 KB
- Modified: 2025-03-17 09:40:18

```ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

// User attributes interface
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'user' | 'guest';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// Attributes for User creation - id and timestamps are optional
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'last_login'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'manager' | 'user' | 'guest';
  public last_login?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // Helper method to compare passwords
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 100], // Minimum 8 characters
      },
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'manager', 'user', 'guest']],
      },
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false, // We'll manually manage created_at and updated_at
    hooks: {
      beforeCreate: async (user: User) => {
        // Hash password before saving
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        // Hash password when updating if it changed
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.updated_at = new Date();
      },
    },
  }
);

export default User;
```

### backend\src\models\index.ts

- Size: 826.0 B
- Modified: 2025-03-17 09:42:37

```ts
import User from './User';
import Property from './Property';
import UploadJob from './UploadJob';
import ActivityLog from './ActivityLog';
import sequelize from '../config/database';

// Define associations between models
User.hasMany(UploadJob, {
  sourceKey: 'id',
  foreignKey: 'user_id',
  as: 'uploadJobs'
});

User.hasMany(ActivityLog, {
  sourceKey: 'id',
  foreignKey: 'user_id',
  as: 'activityLogs'
});

// UploadJob belongsTo User association is already defined in UploadJob.ts
// ActivityLog belongsTo User association is already defined in ActivityLog.ts

// Export models
export {
  User,
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};

// Export default as an object with all models
export default {
  User,
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};
```

### backend\src\repositories\ActivityLogRepository.ts

- Size: 2.0 KB
- Modified: 2025-03-17 19:26:31

```ts
import { Transaction, Op, WhereOptions, fn, col, QueryTypes } from 'sequelize';
import BaseRepository from './BaseRepository';
import ActivityLog, { ActivityLogAttributes, ActivityLogCreationAttributes, logActivity } from '../models/ActivityLog';
import User from '../models/User';

/**
 * Repository class for ActivityLog model
 * Extends BaseRepository with ActivityLog-specific query methods
 */
export default class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super(ActivityLog);
  }

  /**
   * Log a new activity
   * @param logData - Activity log data
   * @returns Created activity log
   */
  async log(logData: ActivityLogCreationAttributes): Promise<ActivityLog> {
    // Use the logActivity helper from the model
    return logActivity(logData);
  }

    /**
   * Get recent activity logs
   * @param limit - Maximum number of logs to return
   * @returns Recent activity logs with user details
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    return this.findAll({
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Get activity counts grouped by user and action type
   * @returns Activity counts by user and action
   */
  async getActivityCountsByUser(): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.model.sequelize!.query(`
      SELECT 
        user_id,
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= :date
      GROUP BY user_id, action
      ORDER BY user_id, count DESC
    `, {
      replacements: { date: thirtyDaysAgo },
      type: QueryTypes.SELECT
    });
  }
}

// Export a singleton instance
export const activityLogRepository = new ActivityLogRepository();
```

### backend\src\repositories\BaseRepository.ts

- Size: 6.0 KB
- Modified: 2025-03-17 09:43:27

```ts
import { Model, ModelCtor, WhereOptions, FindOptions, Op, Transaction, ModelAttributes, CreationAttributes } from 'sequelize';

/**
 * Base Repository class that implements common CRUD operations
 * This class serves as the foundation for all other repositories
 * in the application, following the Repository Pattern for data access abstraction
 */
export default class BaseRepository<T extends Model> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  /**
   * Find a record by its primary key
   * @param id - The primary key value
   * @param options - Additional find options
   * @returns The found record or null
   */
  async findById(id: number | string, options: FindOptions = {}): Promise<T | null> {
    return this.model.findByPk(id, options);
  }

  /**
   * Find a single record based on where conditions
   * @param where - The where conditions
   * @param options - Additional find options
   * @returns The found record or null
   */
  async findOne(where: WhereOptions, options: FindOptions = {}): Promise<T | null> {
    return this.model.findOne({
      ...options,
      where,
    });
  }

  /**
   * Find all records that match the given conditions
   * @param options - Find options including where, order, limit, etc.
   * @returns An array of records
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    return this.model.findAll(options);
  }

  /**
   * Count records that match the given conditions
   * @param options - Find options including where
   * @returns The count of matching records
   */
  async count(options: FindOptions = {}): Promise<number> {
    return this.model.count(options);
  }

  /**
   * Create a new record
   * @param data - The data to create
   * @param transaction - Optional transaction
   * @returns The created record
   */
  async create(data: CreationAttributes<T>, transaction?: Transaction): Promise<T> {
    return this.model.create(data, { 
      transaction 
    });
  }

  /**
   * Update a record by its primary key
   * @param id - The primary key value
   * @param data - The data to update
   * @param transaction - Optional transaction
   * @returns The number of affected rows
   */
  async update(id: number | string, data: Partial<ModelAttributes<T>>, transaction?: Transaction): Promise<[number, T[]]> {
    // First update the record
    const [affectedRows] = await this.model.update(data, {
      where: { id } as any,
      transaction,
    });

    // Then fetch the updated record
    const updatedInstance = await this.model.findByPk(id, { transaction }) as T;
    
    return [affectedRows, updatedInstance ? [updatedInstance] : []];
  }

  /**
   * Update records based on where conditions
   * @param where - The where conditions
   * @param data - The data to update
   * @param transaction - Optional transaction
   * @returns The number of affected rows
   */
  async updateWhere(where: WhereOptions, data: Partial<ModelAttributes<T>>, transaction?: Transaction): Promise<[number, T[]]> {
    return this.model.update(data, {
      where,
      transaction,
      returning: true,
    }) as Promise<[number, T[]]>;
  }

  /**
   * Delete a record by its primary key
   * @param id - The primary key value
   * @param transaction - Optional transaction
   * @returns The number of deleted rows
   */
  async delete(id: number | string, transaction?: Transaction): Promise<number> {
    return this.model.destroy({
      where: { id } as any,
      transaction,
    });
  }

  /**
   * Delete records based on where conditions
   * @param where - The where conditions
   * @param transaction - Optional transaction
   * @returns The number of deleted rows
   */
  async deleteWhere(where: WhereOptions, transaction?: Transaction): Promise<number> {
    return this.model.destroy({
      where,
      transaction,
    });
  }

  /**
   * Find records with pagination
   * @param page - The page number (1-based)
   * @param pageSize - The page size
   * @param options - Additional find options
   * @returns An object with rows and count
   */
  async findPaginated(
    page: number = 1, 
    pageSize: number = 20, 
    options: FindOptions = {}
  ): Promise<{ rows: T[]; count: number; totalPages: number; currentPage: number }> {
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    };
  }

  /**
   * Get model instances by multiple IDs
   * @param ids - Array of IDs to fetch
   * @param options - Additional find options
   * @returns Array of found records
   */
  async findByIds(ids: (number | string)[], options: FindOptions = {}): Promise<T[]> {
    if (!ids.length) return [];
    
    return this.model.findAll({
      ...options,
      where: {
        ...options.where,
        id: { [Op.in]: ids },
      } as any,
    });
  }

  /**
   * Perform a bulk create operation
   * @param records - Array of records to create
   * @param transaction - Optional transaction
   * @returns Array of created records
   */
  async bulkCreate(records: CreationAttributes<T>[], transaction?: Transaction): Promise<T[]> {
    return this.model.bulkCreate(records, {
      transaction,
      returning: true,
    });
  }

  /**
   * Check if a record exists by ID
   * @param id - The ID to check
   * @returns Boolean indicating if record exists
   */
  async exists(id: number | string): Promise<boolean> {
    const count = await this.model.count({
      where: { id } as any,
    });
    return count > 0;
  }

  /**
   * Check if records exist based on where conditions
   * @param where - The where conditions
   * @returns Boolean indicating if records exist
   */
  async existsWhere(where: WhereOptions): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
```

### backend\src\repositories\PropertyRepository.ts

- Size: 10.0 KB
- Modified: 2025-03-17 18:40:21

```ts
import { Transaction, Op, WhereOptions, Sequelize, QueryTypes } from 'sequelize';
import BaseRepository from './BaseRepository';
import Property, { PropertyAttributes, PropertyCreationAttributes } from '../models/Property';
import sequelize from '../config/database';

/**
 * Repository class for Property model
 * Extends BaseRepository with Property-specific query methods
 */
export default class PropertyRepository extends BaseRepository<Property> {
  constructor() {
    super(Property);
  }

  /**
   * Find a property by its exact address combination
   * Used for deduplication during imports
   * @param propertyAddress - Street address
   * @param propertyCity - City
   * @param propertyState - State code
   * @param propertyZip - ZIP code
   * @returns Property instance or null
   */
  async findByAddressCombination(
    propertyAddress: string,
    propertyCity: string,
    propertyState: string,
    propertyZip: string
  ): Promise<Property | null> {
    return this.findOne({
      property_address: propertyAddress,
      property_city: propertyCity,
      property_state: propertyState,
      property_zip: propertyZip,
    });
  }

  /**
   * Search properties by address with autocomplete functionality
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @returns Array of matching properties
   */
  async searchByAddress(query: string, limit: number = 10): Promise<Property[]> {
    // Normalize the query to improve matching
    const normalizedQuery = query.trim().toLowerCase();
    const searchQuery = `%${normalizedQuery}%`;
    
    return this.findAll({
      where: {
        [Op.or]: [
          { property_address: { [Op.iLike]: searchQuery } },
          { property_city: { [Op.iLike]: searchQuery } },
          { property_zip: { [Op.like]: searchQuery } },
        ],
      },
      limit,
      order: [
        ['property_city', 'ASC'],
        ['property_zip', 'ASC'],
        ['property_address', 'ASC'],
      ],
    });
  }

  /**
   * Create a new property or update if it already exists (address-based deduplication)
   * @param propertyData - Property data
   * @param transaction - Optional transaction
   * @returns Created or updated property instance and a boolean indicating if it was created
   */
  async createOrUpdate(
    propertyData: PropertyCreationAttributes,
    transaction?: Transaction
  ): Promise<[Property, boolean]> {
    // Check if property already exists based on address
    const existingProperty = await this.findByAddressCombination(
      propertyData.property_address,
      propertyData.property_city,
      propertyData.property_state,
      propertyData.property_zip
    );

    if (existingProperty) {
      // Update the offer amount if it changed
      if (existingProperty.offer !== propertyData.offer) {
        const [, updatedProperties] = await this.update(
          existingProperty.id,
          { offer: propertyData.offer as any },
          transaction
        );
        return [updatedProperties[0] || existingProperty, false];
      }
      return [existingProperty, false];
    }

    // Create new property if it doesn't exist
    const newProperty = await this.create(propertyData, transaction);
    return [newProperty, true];
  }

  /**
   * Find properties by ZIP code
   * @param zipCode - ZIP code to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified ZIP code
   */
  async findByZipCode(
    zipCode: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_zip: zipCode },
      order: [['property_address', 'ASC']],
    });
  }

  /**
   * Find properties by city
   * @param city - City to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified city
   */
  async findByCity(
    city: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_city: { [Op.iLike]: city } },
      order: [['property_address', 'ASC']],
    });
  }

  /**
   * Find properties by state
   * @param state - State code to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified state
   */
  async findByState(
    state: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_state: state.toUpperCase() },
      order: [
        ['property_city', 'ASC'],
        ['property_address', 'ASC'],
      ],
    });
  }

  /**
   * Find properties by owner (first and last name)
   * @param name - Owner name to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties with the specified owner
   */
  async findByOwnerName(
    name: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    const searchQuery = `%${name}%`;
    
    return this.findPaginated(page, pageSize, {
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: searchQuery } },
          { last_name: { [Op.iLike]: searchQuery } },
        ],
      },
      order: [
        ['last_name', 'ASC'],
        ['first_name', 'ASC'],
      ],
    });
  }

  /**
   * Find properties with offers in a specific range
   * @param minOffer - Minimum offer amount
   * @param maxOffer - Maximum offer amount
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties with offers in the specified range
   */
  async findByOfferRange(
    minOffer: number,
    maxOffer: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: {
        offer: {
          [Op.between]: [minOffer, maxOffer],
        },
      },
      order: [['offer', 'DESC']],
    });
  }

  /**
   * Search properties with multiple criteria
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of matching properties
   */
  async searchProperties(query: string, limit: number = 10, offset: number = 0): Promise<Property[]> {
    const searchTerms = query.split(' ').filter((term: string) => term.length > 0);
    
    const whereConditions: any[] = [];
    
    for (const term of searchTerms) {
      whereConditions.push({
        [Op.or]: [
          { property_address: { [Op.iLike]: `%${term}%` } },
          { property_city: { [Op.iLike]: `%${term}%` } },
          { first_name: { [Op.iLike]: `%${term}%` } },
          { last_name: { [Op.iLike]: `%${term}%` } }
        ]
      });
    }
    
    return this.findAll({
      where: {
        [Op.and]: whereConditions
      },
      limit,
      offset,
      order: [['updated_at', 'DESC']]
    });
  }

  /**
   * Get properties added today
   * @returns Count of properties added today
   */
  async getPropertiesAddedToday(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  return this.count({
    where: {
      created_at: {
        [Op.gte]: todayStart
      }
    }
  });
}

/**
 * Get properties updated today (excluding newly created ones)
 * @returns Count of properties updated today
 */
async getPropertiesUpdatedToday(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  return this.count({
    where: {
      updated_at: {
        [Op.gte]: todayStart
      },
      created_at: {
        [Op.lt]: todayStart
      }
    }
  });
}

  /**
   * Get property statistics by state
   * @returns Array of state statistics with count and average offer
   */
  async getStatsByState(): Promise<Array<{ state: string; count: number; averageOffer: number }>> {
    type StatsResult = { state: string; count: string; averageOffer: string };
    
    const results = await sequelize.query<StatsResult>(`
      SELECT 
        property_state as state, 
        COUNT(*) as count, 
        AVG(offer) as "averageOffer"
      FROM properties 
      GROUP BY property_state 
      ORDER BY COUNT(*) DESC
    `, { type: QueryTypes.SELECT });

    return results.map(result => ({
      state: result.state,
      count: parseInt(result.count, 10),
      averageOffer: parseFloat(result.averageOffer) || 0
    }));
  }

  /**
   * Get property statistics by city for a specific state
   * @param state - State code to filter by
   * @returns Array of city statistics with count and average offer
   */
  async getStatsByCity(state: string): Promise<Array<{ city: string; count: number; averageOffer: number }>> {
    type StatsResult = { city: string; count: string; averageOffer: string };
    
    const results = await sequelize.query<StatsResult>(`
      SELECT 
        property_city as city, 
        COUNT(*) as count, 
        AVG(offer) as "averageOffer"
      FROM properties 
      WHERE property_state = :state
      GROUP BY property_city 
      ORDER BY COUNT(*) DESC
    `, { 
      replacements: { state: state.toUpperCase() },
      type: QueryTypes.SELECT 
    });

    return results.map(result => ({
      city: result.city,
      count: parseInt(result.count, 10),
      averageOffer: parseFloat(result.averageOffer) || 0
    }));
  }
}

// Export a singleton instance
export const propertyRepository = new PropertyRepository();
```

### backend\src\repositories\UploadJobRepository.ts

- Size: 7.5 KB
- Modified: 2025-03-17 09:47:06

```ts
import { Transaction, Op, WhereOptions } from 'sequelize';
import BaseRepository from './BaseRepository';
import UploadJob, { UploadJobAttributes, UploadJobCreationAttributes } from '../models/UploadJob';
import User from '../models/User';

/**
 * Repository class for UploadJob model
 * Extends BaseRepository with UploadJob-specific query methods
 */
export default class UploadJobRepository extends BaseRepository<UploadJob> {
  constructor() {
    super(UploadJob);
  }

  /**
   * Create a new upload job
   * @param jobData - Upload job data
   * @param transaction - Optional transaction
   * @returns Created upload job
   */
  async createJob(jobData: UploadJobCreationAttributes, transaction?: Transaction): Promise<UploadJob> {
    return this.create(jobData, transaction);
  }

  /**
   * Update job status
   * @param jobId - Job ID
   * @param status - New status
   * @param transaction - Optional transaction
   * @returns Updated job
   */
  async updateStatus(
    jobId: string, 
    status: UploadJobAttributes['status'],
    transaction?: Transaction
  ): Promise<UploadJob | null> {
    const job = await this.findById(jobId);
    if (!job) return null;
    
    job.status = status;
    
    // If the job is completed or failed, set the completed_at timestamp
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      job.completed_at = new Date();
    }
    
    await job.save({ transaction });
    return job;
  }

  /**
   * Update job progress
   * @param jobId - Job ID
   * @param stats - Progress statistics
   * @param transaction - Optional transaction
   * @returns Updated job
   */
  async updateProgress(
    jobId: string,
    stats: {
      totalRecords?: number;
      newRecords?: number;
      updatedRecords?: number;
      errorRecords?: number;
    },
    transaction?: Transaction
  ): Promise<UploadJob | null> {
    const job = await this.findById(jobId);
    if (!job) return null;
    
    // Using the model's updateProgress method
    return job.updateProgress(stats);
  }

  /**
   * Find jobs by user ID
   * @param userId - User ID
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated jobs for the specified user
   */
  async findByUserId(
    userId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: UploadJob[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Find jobs by status
   * @param status - Job status
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated jobs with the specified status
   */
  async findByStatus(
    status: UploadJobAttributes['status'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: UploadJob[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { status },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Find jobs by user ID and status
   * @param userId - User ID
   * @param status - Job status
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated jobs for the specified user with the specified status
   */
  async findByUserAndStatus(
    userId: number,
    status: UploadJobAttributes['status'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: UploadJob[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: {
        user_id: userId,
        status,
      },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get recent jobs with details
   * @param limit - Maximum number of jobs to return
   * @returns Recent jobs with user details
   */
  async getRecentJobs(limit: number = 10): Promise<UploadJob[]> {
    return this.findAll({
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Get job statistics
   * @param days - Number of days to look back
   * @returns Job statistics
   */
  async getJobStats(days: number = 30): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
    cancelled: number;
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsErrored: number;
    averageProcessingTime: number;
  }> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const allJobs = await this.findAll({
      where: {
        created_at: {
          [Op.gte]: date,
        },
      },
      attributes: [
        'id',
        'status',
        'total_records',
        'new_records',
        'updated_records',
        'error_records',
        'created_at',
        'completed_at',
      ],
    });
    
    const stats = {
      total: allJobs.length,
      completed: 0,
      failed: 0,
      pending: 0,
      processing: 0,
      cancelled: 0,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsErrored: 0,
      averageProcessingTime: 0,
    };
    
    let totalProcessingTime = 0;
    let completedJobsCount = 0;
    
    allJobs.forEach(job => {
      // Count by status
      if (job.status === 'completed') stats.completed++;
      else if (job.status === 'failed') stats.failed++;
      else if (job.status === 'pending') stats.pending++;
      else if (job.status === 'processing') stats.processing++;
      else if (job.status === 'cancelled') stats.cancelled++;
      
      // Accumulate record counts
      stats.recordsProcessed += job.total_records;
      stats.recordsCreated += job.new_records;
      stats.recordsUpdated += job.updated_records;
      stats.recordsErrored += job.error_records;
      
      // Calculate processing time for completed and failed jobs
      if (job.completed_at && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) {
        const processingTime = Math.floor((job.completed_at.getTime() - job.created_at.getTime()) / 1000); // in seconds
        totalProcessingTime += processingTime;
        completedJobsCount++;
      }
    });
    
    // Calculate average processing time
    stats.averageProcessingTime = completedJobsCount > 0 ? Math.floor(totalProcessingTime / completedJobsCount) : 0;
    
    return stats;
  }

  /**
   * Cancel a job
   * @param jobId - Job ID
   * @returns Cancelled job
   */
  async cancelJob(jobId: string): Promise<UploadJob | null> {
    const job = await this.findById(jobId);
    if (!job) return null;
    
    // Only pending or processing jobs can be cancelled
    if (job.status !== 'pending' && job.status !== 'processing') {
      return job; // Return the job as is if it can't be cancelled
    }
    
    return job.cancel();
  }
}

// Export a singleton instance
export const uploadJobRepository = new UploadJobRepository();
```

### backend\src\repositories\UserRepository.ts

- Size: 4.3 KB
- Modified: 2025-03-17 09:44:29

```ts
import { Transaction, Op, WhereOptions, fn, col, literal } from 'sequelize';
import BaseRepository from './BaseRepository';
import User, { UserAttributes, UserCreationAttributes } from '../models/User';
import sequelize from '../config/database';

/**
 * Repository class for User model
 * Extends BaseRepository with User-specific query methods
 */
export default class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email
   * @param email - Email to search for
   * @returns User instance or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  /**
   * Find a user by email and ensure password is included
   * (useful for authentication)
   * @param email - Email to search for
   * @returns User instance or null
   */
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.findOne(
      { email },
      { attributes: { include: ['password'] } }
    );
  }

  /**
   * Update a user's last login time
   * @param userId - User ID
   * @returns Updated user instance
   */
  async updateLastLogin(userId: number): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    
    user.last_login = new Date();
    await user.save();
    return user;
  }

  /**
   * Find users by role
   * @param role - Role to filter by
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated users with the specified role
   */
  async findByRole(
    role: UserAttributes['role'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: User[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { role },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Search users by name or email
   * @param query - Search query
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated search results
   */
  async searchUsers(
    query: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: User[]; count: number; totalPages: number; currentPage: number }> {
    const searchQuery = `%${query}%`;
    
    return this.findPaginated(page, pageSize, {
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: searchQuery } },
          { email: { [Op.iLike]: searchQuery } },
        ],
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Create a new user with validation
   * @param userData - User data
   * @param transaction - Optional transaction
   * @returns Created user
   */
  async createUser(userData: UserCreationAttributes, transaction?: Transaction): Promise<User> {
    // Email uniqueness validation is handled by the model
    return this.create(userData, transaction);
  }

  /**
   * Change a user's password
   * @param userId - User ID
   * @param newPassword - New password (will be hashed by model hooks)
   * @returns Success indicator
   */
  async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const [affectedRows] = await this.update(userId, {
      password: newPassword,
    });
    
    return affectedRows > 0;
  }

  /**
   * Get active users within a specific period
   * @param days - Number of days to look back
   * @returns User count
   */
  async getActiveUserCount(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.count({
      where: {
        last_login: {
          [Op.gte]: date,
        },
      },
    });
  }

  /**
   * Get users with upload activity
   * @returns Users with related upload counts
   */
  async getUsersWithUploadCounts(): Promise<User[]> {
    return this.findAll({
      include: [
        {
          association: 'uploadJobs',
          attributes: [],
        },
      ],
      attributes: [
        'id',
        'name',
        'email',
        'role',
        [fn('COUNT', col('uploadJobs.id')), 'uploadCount'],
      ],
      group: ['User.id'],
      order: [[literal('uploadCount'), 'DESC']],
    });
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
```

### backend\src\repositories\index.ts

- Size: 820.0 B
- Modified: 2025-03-17 09:48:04

```ts
import BaseRepository from './BaseRepository';
import UserRepository, { userRepository } from './UserRepository';
import PropertyRepository, { propertyRepository } from './PropertyRepository';
import UploadJobRepository, { uploadJobRepository } from './UploadJobRepository';
import ActivityLogRepository, { activityLogRepository } from './ActivityLogRepository';

// Export classes
export {
  BaseRepository,
  UserRepository,
  PropertyRepository,
  UploadJobRepository,
  ActivityLogRepository
};

// Export singleton instances
export {
  userRepository,
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};

// Export default as an object with all repositories
export default {
  userRepository,
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};
```

### backend\src\routes\api-routes.ts

- Size: 1.1 KB
- Modified: 2025-03-17 19:18:38

```ts
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
```

### backend\src\routes\auth-routes.ts

- Size: 1.1 KB
- Modified: 2025-03-17 19:17:44

```ts
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
```

### backend\src\routes\docs-routes.ts

- Size: 1.3 KB
- Modified: 2025-03-17 19:29:37

```ts
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
```

### backend\src\routes\property-routes.ts

- Size: 2.4 KB
- Modified: 2025-03-17 19:18:02

```ts
import { Router } from 'express';
import propertyController from '../controllers/property-controller';
import { propertyValidationRules, validateInput, searchValidationRules, batchPropertyValidationRules, batchPropertyCreationRules } from '../middleware/validateInput';
import { authenticate, authorize } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(propertyController.getAllProperties));

/**
 * @route   GET /api/properties/search
 * @desc    Search properties with autocomplete
 * @access  Private
 */
router.get('/search', authenticate, searchValidationRules(), validateInput, asyncHandler(propertyController.searchProperties));

/**
 * @route   GET /api/properties/:id
 * @desc    Get property by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(propertyController.getPropertyById));

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private - Admin, Manager
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.createProperty)
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private - Admin, Manager
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  propertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.updateProperty)
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private - Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  asyncHandler(propertyController.deleteProperty)
);

/**
 * @route   POST /api/properties/batch
 * @desc    Batch update properties
 * @access  Private - Admin, Manager
 */
router.post(
  '/batch',
  authenticate,
  authorize(['admin', 'manager']),
  batchPropertyValidationRules(),
  validateInput,
  asyncHandler(propertyController.batchUpdateProperties)
);

/**
 * @route   POST /api/properties/batch/create
 * @desc    Batch create properties
 * @access  Private - Admin, Manager
 */
router.post(
  '/batch/create',
  authenticate,
  authorize(['admin', 'manager']),
  batchPropertyCreationRules(),
  validateInput,
  asyncHandler(propertyController.batchCreateProperties)
);

export default router;
```

### backend\src\routes\stats-routes.ts

- Size: 1.2 KB
- Modified: 2025-03-17 19:20:02

```ts
import { Router } from 'express';
import statsController from '../controllers/stats-controller';
import { authenticate, authorize } from '../middleware/auth-middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   GET /api/stats/system
 * @desc    Get system-wide statistics
 * @access  Private
 */
router.get('/system', authenticate, asyncHandler(statsController.getSystemStats));

/**
 * @route   GET /api/stats/properties/by-state
 * @desc    Get property statistics by state
 * @access  Private
 */
router.get('/properties/by-state', authenticate, asyncHandler(statsController.getPropertyStatsByState));

/**
 * @route   GET /api/stats/properties/by-city/:state
 * @desc    Get property statistics by city for a specific state
 * @access  Private
 */
router.get('/properties/by-city/:state', authenticate, asyncHandler(statsController.getPropertyStatsByCity));

/**
 * @route   GET /api/stats/users/activity
 * @desc    Get user activity statistics
 * @access  Private - Admin only
 */
router.get(
  '/users/activity',
  authenticate,
  authorize(['admin']),
  asyncHandler(statsController.getUserActivityStats)
);

export default router;
```

### backend\src\routes\upload-routes.ts

- Size: 1.2 KB
- Modified: 2025-03-17 19:20:09

```ts
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
```

### backend\src\services\FileProcessorService.ts

- Size: 17.0 KB
- Modified: 2025-03-17 09:54:12

```ts
import fs from 'fs';
import { Readable } from 'stream';
import csv from 'csv-parser';
import path from 'path';
import Excel from 'exceljs';
import { PropertyCreationAttributes } from '../models/Property';
import { propertyRepository } from '../repositories/PropertyRepository';
import { uploadJobRepository } from '../repositories/UploadJobRepository';
import { activityLogRepository } from '../repositories/ActivityLogRepository';
import logger from '../logger';
import { EventEmitter } from 'events';

// Define interfaces for better type safety
interface ProcessingStats {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errorRecords: number;
}

/**
 * Service for processing CSV and XLSX files using the Batch Processing Pattern
 * This implementation focuses on efficiency when dealing with large files
 */
export class FileProcessorService {
  private readonly BATCH_SIZE = 1000; // Process 1000 records at a time
  private stream: Readable | null = null;

/**
 * Process a CSV file using the Batch Processing Pattern
 * @param filePath Path to the CSV file
 * @param jobId Unique identifier for this processing job
 * @param userId ID of the user who initiated the job
 * @returns Promise with processing statistics
 */
async processCsvFile(filePath: string, jobId: string, userId: number): Promise<ProcessingStats> {
  // Update job status to processing
  await uploadJobRepository.updateStatus(jobId, 'processing');
  
  // Log activity
  await activityLogRepository.log({
    user_id: userId,
    action: 'start_processing',
    entity_type: 'uploadjob',
    entity_id: jobId,
    details: { filePath, fileType: 'csv' }
  });
    return new Promise((resolve, reject) => {
      const stats: ProcessingStats = {
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0,
        errorRecords: 0
      };
      
      let batch: any[] = [];
      let batchCount = 0;
      
      this.stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row: any) => {
          batch.push(row);
          stats.totalRecords++;
          
      // When batch size is reached, process the batch
      if (batch.length >= this.BATCH_SIZE) {
        // Pause the stream to prevent memory overflow
        this.stream!.pause();
        
        try {
          const batchStats = await this.processBatch(batch, jobId);
          this.updateStats(stats, batchStats);
          
          // Update progress in database
          await this.updateJobProgress(jobId, stats);
          
          // Emit progress event
          this.emitProgress(jobId, stats);
              
          // Log progress
          logger.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
            `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
              
              // Clear the batch array
              batch = [];
              
              // Resume the stream
              this.stream!.resume();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
              reject(error);
            }
          }
        })
        .on('end', async () => {
          // Process any remaining records
          if (batch.length > 0) {
            try {
              const batchStats = await this.processBatch(batch, jobId);
              this.updateStats(stats, batchStats);
              await this.updateJobProgress(jobId, stats);
              this.emitProgress(jobId, stats);
              
              logger.info(`[Job ${jobId}] Processed final batch ${++batchCount}: ` +
                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger.error(`[Job ${jobId}] Error processing final batch:`, errorMessage);
              
              // Update job status to failed
              await uploadJobRepository.updateStatus(jobId, 'failed');
              
              // Log activity
              await activityLogRepository.log({
                user_id: userId,
                action: 'processing_failed',
                entity_type: 'uploadjob',
                entity_id: jobId,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              });
              
              reject(error);
              return;
            }
          }
          
          logger.info(`[Job ${jobId}] Processing completed: ` +
            `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
          
          // Update job status to completed
          await uploadJobRepository.updateStatus(jobId, 'completed');
          
          // Log activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'processing_completed',
            entity_type: 'uploadjob',
            entity_id: jobId,
            details: stats
          });
          
          resolve(stats);
        })
        .on('error', async (error: Error) => {
          logger.error(`[Job ${jobId}] Stream error:`, error);
          
          // Update job status to failed
          await uploadJobRepository.updateStatus(jobId, 'failed');
          
          // Log activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'processing_failed',
            entity_type: 'uploadjob',
            entity_id: jobId,
              details: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
          
          reject(error);
        });
    });
  }
  
  /**
   * Process an XLSX file using the Batch Processing Pattern
   * @param filePath Path to the XLSX file
   * @param jobId Unique identifier for this processing job
   * @param userId ID of the user who initiated the job
   * @returns Promise with processing statistics
   */
  async processXlsxFile(filePath: string, jobId: string, userId: number): Promise<ProcessingStats> {
    // Update job status to processing
    await uploadJobRepository.updateStatus(jobId, 'processing');
    
    // Log activity
    await activityLogRepository.log({
      user_id: userId,
      action: 'start_processing',
      entity_type: 'uploadjob',
      entity_id: jobId,
      details: { filePath, fileType: 'xlsx' }
    });
    
    return new Promise(async (resolve, reject) => {
      const stats: ProcessingStats = {
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0,
        errorRecords: 0
      };
      
      try {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1); // Get the first worksheet
        
        if (!worksheet) {
          throw new Error('Worksheet not found');
        }
        
        let batch: any[] = [];
        let batchCount = 0;
        let rowCount = 0;
        
        // Get header row
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        
        headerRow.eachCell((cell: any, colNumber: number) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });
        
        // Process rows
        worksheet.eachRow({ includeEmpty: false }, async (row: any, rowNumber: number) => {
          // Skip header row
          if (rowNumber === 1) return;
          
          const rowData: any = {};
          
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
          });
          
          batch.push(rowData);
          stats.totalRecords++;
          rowCount++;
          
          // When batch size is reached, process the batch
          if (batch.length >= this.BATCH_SIZE) {
            try {
              const batchStats = await this.processBatch(batch, jobId);
              this.updateStats(stats, batchStats);
              
              // Update progress in database
              await this.updateJobProgress(jobId, stats);
              
              // Emit progress event
              this.emitProgress(jobId, stats);
              
              // Log progress
              logger.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
              
              batch = [];
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
              reject(error);
            }
          }
        });
        
        // Process any remaining records
        if (batch.length > 0) {
          try {
            const batchStats = await this.processBatch(batch, jobId);
            this.updateStats(stats, batchStats);
            await this.updateJobProgress(jobId, stats);
            this.emitProgress(jobId, stats);
            
            logger.info(`[Job ${jobId}] Processed final batch ${++batchCount}: ` +
              `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`[Job ${jobId}] Error processing final batch:`, errorMessage);
            
            // Update job status to failed
            await uploadJobRepository.updateStatus(jobId, 'failed');
            
            // Log activity
            await activityLogRepository.log({
              user_id: userId,
              action: 'processing_failed',
              entity_type: 'uploadjob',
              entity_id: jobId,
              details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
            
            reject(error);
            return;
          }
        }
        
        logger.info(`[Job ${jobId}] Processing completed: ` +
          `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
        
        // Update job status to completed
        await uploadJobRepository.updateStatus(jobId, 'completed');
        
        // Log activity
        await activityLogRepository.log({
          user_id: userId,
          action: 'processing_completed',
          entity_type: 'uploadjob',
          entity_id: jobId,
          details: stats
        });
        
        resolve(stats);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error processing XLSX file:`, errorMessage);
        
        // Update job status to failed
        await uploadJobRepository.updateStatus(jobId, 'failed');
        
        // Log activity
        await activityLogRepository.log({
          user_id: userId,
          action: 'processing_failed',
          entity_type: 'uploadjob',
          entity_id: jobId,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        
        reject(error);
      }
    });
  }

  /**
   * Process a batch of records
   * @param batch Array of records to process
   * @param jobId Unique identifier for this processing job
   * @returns Promise with batch processing statistics
   */
  private async processBatch(batch: any[], jobId: string): Promise<ProcessingStats> {
    const stats: ProcessingStats = {
      totalRecords: batch.length,
      newRecords: 0,
      updatedRecords: 0,
      errorRecords: 0
    };
    
    // Process each record in the batch
    for (const row of batch) {
      try {
        const propertyData = this.transformRowToPropertyData(row);
        
        // Create or update property using the repository's createOrUpdate method
        const [property, isNew] = await propertyRepository.createOrUpdate(propertyData);
        
        if (isNew) {
          stats.newRecords++;
        } else {
          stats.updatedRecords++;
        }
      } catch (error: unknown) {
        stats.errorRecords++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error processing record: ${JSON.stringify(row)}`, errorMessage);
      }
    }
    
    return stats;
  }
  
  /**
   * Transform a raw data row into a PropertyCreationAttributes object
   * This method handles data normalization and validation
   * @param row Raw data row
   * @returns Transformed PropertyCreationAttributes object
   */
  private transformRowToPropertyData(row: any): PropertyCreationAttributes {
    // Extract and normalize property data
    return {
      first_name: row.firstName || row.first_name || null,
      last_name: row.lastName || row.last_name || null,
      property_address: this.normalizeAddress(row.propertyAddress || row.property_address || row.address || ''),
      property_city: this.normalizeCity(row.propertyCity || row.property_city || row.city || ''),
      property_state: this.normalizeState(row.propertyState || row.property_state || row.state || ''),
      property_zip: this.normalizeZip(row.propertyZip || row.property_zip || row.zip || ''),
      offer: parseFloat(row.offer || '0'),
      created_at: new Date(),
      updated_at: new Date()
    };
  }
  
  /**
   * Update the overall statistics with batch statistics
   * @param stats Overall statistics to update
   * @param batchStats Batch statistics to add
   */
  private updateStats(stats: ProcessingStats, batchStats: ProcessingStats): void {
    stats.newRecords += batchStats.newRecords;
    stats.updatedRecords += batchStats.updatedRecords;
    stats.errorRecords += batchStats.errorRecords;
  }
  
  /**
   * Update job progress in the database
   * @param jobId Unique identifier for this processing job
   * @param stats Current processing statistics
   */
  private async updateJobProgress(jobId: string, stats: ProcessingStats): Promise<void> {
    await uploadJobRepository.updateProgress(jobId, {
      totalRecords: stats.totalRecords,
      newRecords: stats.newRecords,
      updatedRecords: stats.updatedRecords,
      errorRecords: stats.errorRecords
    });
  }
  
  // Observer Pattern implementation
  private progressObservers: Map<string, Function[]> = new Map();
  
  /**
   * Register a callback for progress updates
   * @param jobId Job ID to observe
   * @param callback Function to call with progress updates
   */
  public onProgress(jobId: string, callback: (stats: ProcessingStats) => void): void {
    if (!this.progressObservers.has(jobId)) {
      this.progressObservers.set(jobId, []);
    }
    
    this.progressObservers.get(jobId)!.push(callback);
  }
  
  /**
   * Remove a progress callback
   * @param jobId Job ID
   * @param callback Function to remove
   */
  public offProgress(jobId: string, callback: Function): void {
    if (!this.progressObservers.has(jobId)) return;
    
    const observers = this.progressObservers.get(jobId)!;
    const index = observers.indexOf(callback);
    
    if (index !== -1) {
      observers.splice(index, 1);
    }
    
    if (observers.length === 0) {
      this.progressObservers.delete(jobId);
    }
  }
  
  /**
   * Emit a progress update to all registered observers
   * @param jobId Job ID
   * @param stats Processing statistics
   */
  private emitProgress(jobId: string, stats: ProcessingStats): void {
    if (!this.progressObservers.has(jobId)) return;
    
    for (const callback of this.progressObservers.get(jobId)!) {
      try {
        callback(stats);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error in progress callback:`, errorMessage);
      }
    }
  }
  
  // Helper methods for data normalization
  
  private normalizeAddress(address: string): string {
    return address.trim().replace(/\s{2,}/g, ' ');
  }
  
  private normalizeCity(city: string): string {
    return city.trim().replace(/\s{2,}/g, ' ');
  }
  
  private normalizeState(state: string): string {
    return state.trim().toUpperCase();
  }
  
  private normalizeZip(zip: string): string {
    // Extract just the digits for the first 5 digits of the zip code
    const zipDigits = zip.replace(/\D/g, '');
    return zipDigits.substring(0, 5);
  }
}

export default FileProcessorService;
```

### backend\src\services\TokenService.ts

- Size: 797.0 B
- Modified: 2025-03-17 18:34:58

```ts
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/environment';

export class TokenService {
  static generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        email: user.email
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION } as SignOptions
    );
  }

  static verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  }

  static getTokenFromHeaders(headers: any): string | null {
    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return null;
  }
}
```

### backend\src\services\redis-service.ts

- Size: 5.2 KB
- Modified: 2025-03-17 19:16:23

```ts
import Redis from 'ioredis';
import logger from '../logger';

// Redis client options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client
const redisClient = new Redis(redisOptions);

// Handle Redis connection events
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('reconnecting', (ms: number) => {
  logger.info(`Reconnecting to Redis in ${ms}ms`);
});

/**
 * Redis cache service
 */
class RedisService {
  private client: Redis;
  private DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(redisClient: Redis) {
    this.client = redisClient;
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await this.client.set(key, stringValue, 'EX', ttl);
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      
      if (!value) return null;
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   * @param keyValuePairs Object with key-value pairs to cache
   * @param ttl Time to live in seconds (optional)
   */
  async mset(keyValuePairs: Record<string, any>, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        pipeline.set(key, stringValue, 'EX', ttl);
      }
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Redis mset error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Object with key-value pairs from cache
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.client.mget(keys);
      
      return keys.reduce((result, key, index) => {
        const value = values[index];
        
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch (e) {
            result[key] = value;
          }
        } else {
          result[key] = null;
        }
        
        return result;
      }, {} as Record<string, any>);
    } catch (error) {
      logger.error('Redis mget error:', error);
      return {};
    }
  }

  /**
   * Clear cache - USE WITH CAUTION
   */
  async clearCache(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      logger.error('Redis clearCache error:', error);
      throw error;
    }
  }
  
  /**
   * Store session data
   * @param sessionId Session ID
   * @param data Session data
   * @param ttl Time to live in seconds (optional)
   */
  async setSession(sessionId: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  /**
   * Get session data
   * @param sessionId Session ID
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  /**
   * Delete session data
   * @param sessionId Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }
}

// Export Redis service instance
export const redisService = new RedisService(redisClient);

// Export Redis client for direct use if needed
export default redisClient;
```

### backend\src\utils\asyncHandler.ts

- Size: 487.0 B
- Modified: 2025-03-17 19:13:44

```ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller function to properly handle errors
 * This solves the TypeScript type mismatch with Express RequestHandler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### frontend\README.md

- Size: 2.1 KB
- Modified: 2025-03-17 08:35:51

```md
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
```

### frontend\config-overrides.js

- Size: 452.0 B
- Modified: 2025-03-17 17:10:25

```js
module.exports = function override(config, env) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    stream: require.resolve("stream-browserify"),
    zlib: require.resolve("browserify-zlib"),
    util: require.resolve("util/"),
    url: require.resolve("url/"),
  };

  return config;
};
```

### frontend\public\index.html

- Size: 168.0 B
- Modified: 2025-03-17 20:37:03

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mailers Offers</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### frontend\src\App.css

- Size: 564.0 B
- Modified: 2025-03-17 08:35:49

```css
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### frontend\src\App.test.tsx

- Size: 273.0 B
- Modified: 2025-03-17 08:35:52

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

### frontend\src\App.tsx

- Size: 9.6 KB
- Modified: 2025-03-18 13:12:59

```tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Box, 
  Container, 
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { blue, green } from '@mui/material/colors';

// Import components
import Login from './components/auth/Login';
import Registration from './components/auth/Registration';
import Dashboard from './components/dashboard/Dashboard';
import PropertySearch from './components/property/PropertySearch';
import PropertyDetail from './components/property/PropertyDetail';
import FileUpload from './components/upload/FileUpload';
import Navigation from './components/layout/Navigation';

// Import API services
import { authAPI, propertyAPI, uploadAPI, statsAPI, handleApiError } from './services/api';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: green[600],
    },
  },
});

// Define user interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Auth context interface and implementation
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await authAPI.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        setNotification({
          message: 'Login successful',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      
      // Clear local storage and state
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      setNotification({
        message: 'You have been logged out',
        type: 'info'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search properties
  const searchProperties = async (query: string) => {
    try {
      const results = await propertyAPI.searchProperties(query);
      return results;
    } catch (error) {
      console.error('Property search failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      return [];
    }
  };

  // Handle property selection
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
  };

  // Get property details
  const getPropertyDetails = async (id: number) => {
    try {
      const response = await propertyAPI.getPropertyById(id);
      if (response.success && response.property) {
        setSelectedProperty(response.property);
        return response.property;
      }
    } catch (error) {
      console.error('Failed to get property details:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
    }
    return null;
  };

  // Update property
  const updateProperty = async (id: number, data: any) => {
    try {
      const response = await propertyAPI.updateProperty(id, data);
      if (response.success && response.property) {
        setNotification({
          message: 'Property updated successfully',
          type: 'success'
        });
        return response.property;
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    }
    return null;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success) {
        setNotification({
          message: 'File upload started. You can check the status using the job ID.',
          type: 'success'
        });
        return response;
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    }
    return null;
  };

  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      return await statsAPI.getSystemStats();
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Auth context value
  const authContextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };

  // If initial loading
  if (loading && !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={authContextValue}>
        <Router>
          {isAuthenticated && <Navigation />}
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Routes>
                <Route 
                  path="/" 
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} 
                />
                <Route 
                  path="/login" 
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} 
                />
                <Route 
                  path="/register" 
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <Registration />} 
                />
                <Route 
                  path="/dashboard" 
                  element={isAuthenticated ? <Dashboard fetchStats={fetchSystemStats} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/search" 
                  element={
                    isAuthenticated ? 
                      <Box>
                        <PropertySearch 
                          onSearch={searchProperties} 
                          onSelectProperty={handlePropertySelect} 
                        />
                        {selectedProperty && (
                          <Box mt={4}>
                            <PropertyDetail 
                              property={selectedProperty} 
                              onUpdate={updateProperty}
                              editable={user?.role === 'admin' || user?.role === 'manager'} 
                            />
                          </Box>
                        )}
                      </Box> : 
                      <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/upload" 
                  element={
                    isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') ? 
                      <FileUpload onUpload={handleFileUpload} /> : 
                      <Navigate to="/login" />
                  } 
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </AuthContext.Provider>
      
      {/* Notification */}
      <Snackbar 
        open={notification !== null} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
```

### frontend\src\index.css

- Size: 366.0 B
- Modified: 2025-03-17 08:35:49

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

### frontend\src\index.tsx

- Size: 553.0 B
- Modified: 2025-03-17 12:58:57

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

### frontend\src\reportWebVitals.ts

- Size: 425.0 B
- Modified: 2025-03-17 08:35:52

```ts
import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
```

### frontend\src\setupTests.ts

- Size: 241.0 B
- Modified: 2025-03-17 08:35:52

```ts
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
```

### frontend\src\components\auth\Login.tsx

- Size: 4.0 KB
- Modified: 2025-03-18 13:12:39

```tsx
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
}).required();

// TypeScript interface for form data
interface LoginFormData {
  email: string;
  password: string;
}

// Props interface
interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading = false, error = null }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Submit handler
  const onSubmit = async (data: LoginFormData) => {
    await onLogin(data.email, data.password);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        marginTop: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 1 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  autoComplete="email"
                  autoFocus
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Link href="/register" variant="body2">
                Don't have an account? Sign up
              </Link>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
```

### frontend\src\components\auth\Registration.tsx

- Size: 8.8 KB
- Modified: 2025-03-18 13:12:27

```tsx
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Check, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI } from '../../services/api';

// Define validation schema with password requirements
const registerSchema = yup.object({
  name: yup
    .string()
    .required('Name is required'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
}).required();

// TypeScript interface for form data
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  // Get current password value for validation display
  const password = watch('password', '');
  
  // Password requirement checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  // Submit handler
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { confirmPassword, ...userData } = data;
      await authAPI.register(userData);
      
      setSuccess(true);
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        marginTop: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Create Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Registration successful! Redirecting to login...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  autoComplete="name"
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
            
            {/* Password requirements checklist */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Password must have:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasMinLength ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least 8 characters" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasUppercase ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one uppercase letter" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasLowercase ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one lowercase letter" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasNumber ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one number" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasSpecial ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one special character" />
                </ListItem>
              </List>
            </Box>
            
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              )}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || success}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Link href="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Registration;
```

### frontend\src\components\dashboard\Dashboard.tsx

- Size: 11.7 KB
- Modified: 2025-03-17 12:57:21

```tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Update as UpdateIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Define TypeScript interfaces for the data
interface ActivityItem {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  details?: any;
}

interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  cancelled: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsErrored: number;
  averageProcessingTime: number;
}

interface SystemStats {
  users: {
    total: number;
    active: number;
  };
  properties: {
    total: number;
    addedToday: number;
    updatedToday: number;
  };
  uploads: UploadStats;
  recentActivities: ActivityItem[];
}

interface DashboardProps {
  fetchStats: () => Promise<SystemStats>;
}

const Dashboard: React.FC<DashboardProps> = ({ fetchStats }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Refresh stats every minute
    const interval = setInterval(loadStats, 60000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get color for activity type
  const getActivityColor = (action: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (action) {
      case 'create':
      case 'upload':
      case 'register':
        return 'success';
      case 'delete':
      case 'upload_failed':
      case 'processing_failed':
        return 'error';
      case 'update':
      case 'batch_update':
        return 'warning';
      case 'login':
      case 'logout':
      case 'view':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get icon for activity type
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.action) {
      case 'create':
      case 'add':
        return <AddIcon color="success" />;
      case 'update':
      case 'batch_update':
        return <UpdateIcon color="warning" />;
      case 'upload':
      case 'upload_failed':
      case 'processing_failed':
        return <UploadIcon color={activity.action.includes('failed') ? 'error' : 'success'} />;
      case 'login':
      case 'logout':
      case 'register':
        return <PersonIcon color="info" />;
      default:
        return <HomeIcon />;
    }
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" gutterBottom>
          Error loading dashboard data: {error}
        </Typography>
        <Typography>
          Please try refreshing the page or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Property Stats */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Properties
              </Typography>
              <Typography variant="h3" color="primary">
                {stats?.properties.total.toLocaleString() || 0}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Added Today</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.properties.addedToday.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Updated Today</Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats?.properties.updatedToday.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* User Stats */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users
              </Typography>
              <Typography variant="h3" color="primary">
                {stats?.users.total.toLocaleString() || 0}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Active Users (Last 7 Days)</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.users.active.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Upload Stats */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Uploads (Last 30 Days)
              </Typography>
              <Typography variant="h3" color="primary">
                {stats?.uploads.total.toLocaleString() || 0}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Completed</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.uploads.completed.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Records Processed</Typography>
                  <Typography variant="h6">
                    {stats?.uploads.recordsProcessed.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  {getActivityIcon(activity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1">
                        {`${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.entityType}`}
                      </Typography>
                      <Chip
                        size="small"
                        label={activity.action}
                        color={getActivityColor(activity.action)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={`${formatDate(activity.timestamp)} ${activity.entityId ? `• ID: ${activity.entityId}` : ''}`}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No recent activity" />
            </ListItem>
          )}
        </List>
      </Paper>
      
      {/* Upload Statistics */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upload Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Processing Status</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Completed</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.uploads.completed || 0}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Failed</Typography>
                  <Typography variant="h6" color="error.main">
                    {stats?.uploads.failed || 0}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Processing</Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats?.uploads.processing || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Record Processing</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Created</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.uploads.recordsCreated.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Updated</Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats?.uploads.recordsUpdated.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Errors</Typography>
                  <Typography variant="h6" color="error.main">
                    {stats?.uploads.recordsErrored.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
```

### frontend\src\components\layout\Navigation.tsx

- Size: 7.1 KB
- Modified: 2025-03-17 18:02:46

```tsx
import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

// Import auth context
import { AuthContext } from '../../App';

interface NavigationProps {
  title?: string;
}

const Navigation: React.FC<NavigationProps> = ({ title = 'Direct Mail Offer System' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    if (authContext) {
      await authContext.logout();
      navigate('/login');
    }
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Check if user has required role
  const hasRole = (requiredRoles: string[]) => {
    if (!authContext || !authContext.user) return false;
    return requiredRoles.includes(authContext.user.role) || authContext.user.role === 'admin';
  };

  // Get first letter of user name for avatar
  const getUserInitial = () => {
    if (!authContext || !authContext.user) return 'U';
    return authContext.user.name.charAt(0).toUpperCase();
  };

  // Check if path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {authContext && authContext.isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {getUserInitial()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {authContext.user?.name}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    {authContext.user?.role}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem
              component="button" // Keep this
              onClick={() => handleNavigation('/dashboard')}
              sx={{
                backgroundColor: isActive('/dashboard') ? 'action.selected' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive('/dashboard') ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>

            <ListItem
              component="button" // Keep this
              onClick={() => handleNavigation('/search')}
              sx={{
                backgroundColor: isActive('/search') ? 'action.selected' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive('/search') ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <SearchIcon color={isActive('/search') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Search Properties" />
            </ListItem>

            {hasRole(['admin', 'manager']) && (
              <ListItem
                component="button" // Keep this
                onClick={() => handleNavigation('/upload')}
                sx={{
                  backgroundColor: isActive('/upload') ? 'action.selected' : 'inherit',
                  '&:hover': {
                    backgroundColor: isActive('/upload') ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <UploadIcon color={isActive('/upload') ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Upload Data" />
              </ListItem>
            )}
          </List>

          <Divider />

          <List>
            <ListItem
              component="button" // Keep this
              onClick={handleLogout}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
```

### frontend\src\components\property\PropertyDetail.tsx

- Size: 11.1 KB
- Modified: 2025-03-17 18:09:07

```tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define validation schema
const propertyUpdateSchema = yup.object({
  id: yup.number().required('ID is required'),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  propertyAddress: yup.string().required('Address is required'),
  propertyCity: yup.string().required('City is required'),
  propertyState: yup
    .string()
    .required('State is required')
    .matches(/^[A-Z]{2}$/, 'State must be a 2-letter code'),
  propertyZip: yup
    .string()
    .required('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/, 'ZIP code must be valid (e.g., 12345 or 12345-6789)'),
  offer: yup
    .number()
    .required('Offer is required')
    .min(0, 'Offer cannot be negative'),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional()
}).required();

// Define TypeScript interfaces
export interface Property {
  id: number;
  firstName?: string;
  lastName?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offer: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PropertyDetailProps {
  property: Property;
  onUpdate?: (id: number, data: Partial<Property>) => Promise<Property>;
  editable?: boolean;
  isLoading?: boolean;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  onUpdate,
  editable = false,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Setup form
  const { control, handleSubmit, formState: { errors } } = useForm<Property>({
    resolver: yupResolver(propertyUpdateSchema),
    defaultValues: property
  });

  // Handle form submission
  const onSubmit = async (data: Property) => {
    if (!onUpdate) return;
    
    setUpdateError(null);
    try {
      await onUpdate(property.id, data);
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUpdateError(errorMessage);
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Property Details
          </Typography>
          
          {editable && !isEditing && (
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined" 
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit
            </Button>
          )}
        </Box>
        
        {/* Edit Mode */}
        {isEditing ? (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      margin="normal"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      margin="normal"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="propertyAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Property Address"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyAddress}
                      helperText={errors.propertyAddress?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="propertyCity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyCity}
                      helperText={errors.propertyCity?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Controller
                  name="propertyState"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      required
                      margin="normal"
                      inputProps={{ maxLength: 2 }}
                      error={!!errors.propertyState}
                      helperText={errors.propertyState?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Controller
                  name="propertyZip"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ZIP Code"
                      fullWidth
                      required
                      margin="normal"
                      error={!!errors.propertyZip}
                      helperText={errors.propertyZip?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="offer"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Offer Amount"
                      fullWidth
                      required
                      margin="normal"
                      type="number"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                      error={!!errors.offer}
                      helperText={errors.offer?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
            
            {updateError && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">{updateError}</Typography>
              </Box>
            )}
          </Box>
        ) : (
          // View Mode
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">
                {property.propertyAddress}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {property.propertyCity}, {property.propertyState} {property.propertyZip}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Owner
              </Typography>
              <Typography variant="body1">
                {property.firstName || ''} {property.lastName || ''}
                {!property.firstName && !property.lastName && 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Offer Amount
              </Typography>
              <Chip
                label={`$${property.offer.toLocaleString()}`}
                color="primary"
                sx={{ fontWeight: 'bold', fontSize: '1rem' }}
              />
            </Grid>
            
            {property.createdAt && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyDetail;
```

### frontend\src\components\property\PropertySearch.tsx

- Size: 5.0 KB
- Modified: 2025-03-17 18:09:36

```tsx
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Paper, 
  Typography, 
  Box,
  Chip,
  Grid,
  useTheme
} from '@mui/material';
import { debounce } from 'lodash';

// Define TypeScript interface for property
interface Property {
  id: number;
  firstName?: string;
  lastName?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offer: number;
}

// Props interface
interface PropertySearchProps {
  onSearch: (query: string) => Promise<Property[]>;
  onSelectProperty: (property: Property | null) => void;
  placeholder?: string;
  minSearchLength?: number;
}

const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  onSelectProperty,
  placeholder = "Search by address, city, state, zip, or owner name",
  minSearchLength = 2
}: PropertySearchProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Property[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // Perform search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < minSearchLength) {
      setOptions([]);
      return;
    }

    let active = true;
    setLoading(true);

    const searchProperties = async () => {
      try {
        const results = await onSearch(searchQuery);
        if (active) {
          setOptions(results);
        }
      } catch (error) {
        console.error('Error searching properties:', error);
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    searchProperties();

    return () => {
      active = false;
    };
  }, [searchQuery, onSearch, minSearchLength]);

  // Debounced search query updater
  const debouncedSetSearchQuery = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Input value change handler
  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    debouncedSetSearchQuery(newInputValue);
  };

  return (
    <Autocomplete
      id="property-search-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      filterOptions={(x: any) => x} // Disable client-side filtering
      getOptionLabel={(option: Property) => `${option.propertyAddress}, ${option.propertyCity}, ${option.propertyState} ${option.propertyZip}`}
      onChange={(_event: React.SyntheticEvent, newValue: Property | null) => onSelectProperty(newValue)}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      noOptionsText={inputValue.length < minSearchLength ? "Type to search..." : "No properties found"}
      renderOption={(props: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>, option: Property) => (
        <li {...props}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              width: '100%',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight="medium">
                  {option.propertyAddress}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {option.propertyCity}, {option.propertyState} {option.propertyZip}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Chip
                    label={`$${option.offer.toLocaleString()}`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </li>
      )}
      renderInput={(params: any) => (
        <TextField
          {...params}
          label="Search Properties"
          placeholder={placeholder}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}

export default PropertySearch;
```

### frontend\src\components\upload\FileUpload.tsx

- Size: 9.0 KB
- Modified: 2025-03-17 11:45:55

```tsx
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert, 
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Define interfaces for TypeScript
interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  jobId?: string;
}

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ jobId: string; message: string }>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 1
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    processFiles(selectedFiles);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  };

  // Process and validate files
  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    // Check if adding more files would exceed maxFiles
    if (files.length + fileList.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} file${maxFiles > 1 ? 's' : ''}`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`File type ${fileExtension} is not supported. Accepted types: ${acceptedFileTypes.join(', ')}`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(`File ${file.name} exceeds the maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      // Add file to list
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        file,
        progress: 0,
        status: 'pending'
      });
    }

    setFiles([...files, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  // Upload file
  const uploadFile = async (id: string) => {
    const fileToUpload = files.find(file => file.id === id);
    if (!fileToUpload) return;

    // Update file status
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status: 'uploading', progress: 0 } : file
    ));

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(file => 
          file.id === id && file.status === 'uploading' && file.progress < 90
            ? { ...file, progress: file.progress + 10 }
            : file
        ));
      }, 500);

      // Actual upload
      const result = await onUpload(fileToUpload.file);
      
      clearInterval(progressInterval);

      // Update file status with job ID
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          jobId: result.jobId
        } : file
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update file status with error
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          status: 'error', 
          progress: 0,
          errorMessage 
        } : file
      ));

      setError(`Failed to upload ${fileToUpload.file.name}: ${errorMessage}`);
    }
  };

  // Upload all pending files
  const uploadAllFiles = () => {
    files.forEach(file => {
      if (file.status === 'pending') {
        uploadFile(file.id);
      }
    });
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        padding: 3,
        width: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload Property Data
      </Typography>

      {/* Drop zone */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          padding: 4,
          textAlign: 'center',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          mb: 3
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept={acceptedFileTypes.join(',')}
          multiple={maxFiles > 1}
        />
        <CloudUploadIcon color="primary" fontSize="large" />
        <Typography variant="h6" mt={2}>
          Drag and drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Accepted file types: {acceptedFileTypes.join(', ')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Maximum file size: {formatFileSize(maxFileSize)}
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <List sx={{ width: '100%', mb: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                backgroundColor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.file.name}
                secondary={`${formatFileSize(file.file.size)} • ${file.status === 'completed' 
                  ? 'Uploaded' 
                  : file.status === 'error' 
                    ? 'Error' 
                    : file.status === 'uploading' 
                      ? 'Uploading...' 
                      : 'Ready to upload'
                }`}
              />
              {file.status === 'uploading' && (
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={file.progress} />
                </Box>
              )}
              <ListItemSecondaryAction>
                {file.status === 'pending' && (
                  <IconButton edge="end" onClick={() => removeFile(file.id)}>
                    <CloseIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload button */}
      {files.some(file => file.status === 'pending') && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={uploadAllFiles}
        >
          Upload Files
        </Button>
      )}
    </Paper>
  );
};

export default FileUpload;
```

### frontend\src\services\api.ts

- Size: 6.7 KB
- Modified: 2025-03-17 17:35:45

```ts
// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Timeout duration in milliseconds
const TIMEOUT_DURATION = 30000; // 30 seconds

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<any> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_DURATION);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    // Try to parse as JSON, return empty object if there's no content
    const data = await response.json().catch(() => ({}));
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

// Helper to add authorization header
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
  },
  
  register: async (userData: { name: string; email: string; password: string }) => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
  },
  
  logout: async () => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },
  
  getProfile: async () => {
    return fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
};

// Property API calls
export const propertyAPI = {
  getAllProperties: async (page: number = 1, limit: number = 20) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  getPropertyById: async (id: number) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  searchProperties: async (query: string, limit: number = 10) => {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    return response.results || [];
  },
  
  createProperty: async (propertyData: any) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });
  },
  
  updateProperty: async (id: number, propertyData: any) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData)
    });
  },
  
  deleteProperty: async (id: number) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },
  
  batchUpdateProperties: async (properties: any[]) => {
    return fetchWithTimeout(`${API_BASE_URL}/properties/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ properties })
    });
  },
};

// Upload API calls
export const uploadAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get auth token but don't include content type - browser will set it with boundary
    const headers: HeadersInit = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetchWithTimeout(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
  },
  
  getJobStatus: async (jobId: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/${jobId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
  
  cancelJob: async (jobId: string) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/${jobId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
  },
  
  getUserJobs: async (page: number = 1, limit: number = 10) => {
    return fetchWithTimeout(`${API_BASE_URL}/upload/jobs?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },
};

// Stats API calls
export const statsAPI = {
  getSystemStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/system`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getPropertyStatsByState: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/properties/by-state`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getPropertyStatsByCity: async (state: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/properties/by-city/${state}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
  
  getUserActivityStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/stats/users/activity`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.stats;
  },
};

// Helper for handling API errors
export const handleApiError = (error: any): string => {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'No response from server. Please check your internet connection.';
  } else if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

// Default export for convenience
export default {
  authAPI,
  propertyAPI,
  uploadAPI,
  statsAPI,
  handleApiError
};
```

### memory-bank\activeContext.md

- Size: 2.8 KB
- Modified: 2025-03-17 19:04:07

```md
# Active Context

## Active Context Updates

- Implemented Stats Controller with complete system statistics API
- Added batch update and batch create capabilities for properties
- Implemented Redis caching for dashboard data with appropriate cache invalidation strategies
- Created database initialization scripts with schema, indexes, triggers, and sample data
- Added Swagger/OpenAPI documentation with interactive UI
- Set up documentation routes at `/api/docs`
- Standardized async handler pattern for type-safe route handling
- Implemented consistent error propagation in async functions

## Current Technical Focus

- Type safety improvements in Express route handlers
- Standardization of async/await patterns
- Error handling consistency across controllers
- TypeScript configuration optimization

## Technical Challenges Addressed

1. Express Request Handler Type Safety:

   - Implemented standardized async wrapper pattern
   - Resolved Promise<void> return type issues
   - Added proper error propagation through next()

2. Controller Type Consistency:
   - Standardized response type handling
   - Improved error type definitions
   - Enhanced middleware type safety

## Next Steps Update

Backend:

- ✅ Add statistics and dashboard endpoints
- ✅ Implement batch update capabilities
- ✅ Create database initialization scripts
- ✅ Generate API documentation with Swagger/OpenAPI
- ✅ Standardize async handler pattern
- ✅ Implement type-safe route handlers

Remaining tasks:

- Write unit tests for controllers and services
- Create integration tests for API endpoints
- Create migration scripts for schema updates
- Document deployment procedures
- Set up CI/CD pipeline for automated testing
- Implement comprehensive error boundary testing
- Add type coverage reporting to test suite

Frontend tasks remain unchanged.

## Current Focus Areas

1. Type Safety:

   - Continuing to improve type definitions
   - Enhancing controller return type consistency
   - Implementing stricter type checking

2. Error Handling:

   - Standardizing error propagation
   - Improving error type definitions
   - Enhancing error logging

3. Testing:
   - Planning type safety test coverage
   - Designing integration test strategy
   - Preparing error boundary tests

## Implementation Notes

- Async handler pattern now standardized across all routes
- Type-safe error propagation implemented
- Controller return types properly typed
- Express middleware chain type safety improved

## Current Technical Blockers

1. Type mismatch in route handlers
2. Express type definitions vs controller implementations
3. Circular import warnings in TS compilation

## Proposed Solution Path

1. Standardize async handler pattern
2. Update controller return types to `Promise<void>`
3. Add @types/express-async-handler
```

### memory-bank\productContext.md

- Size: 885.0 B
- Modified: 2025-03-17 08:09:42

```md
# Product Context

## Problems Solved

- Inefficient management of property offers.
- Data entry errors in property offer records.
- Lack of quick access to property offer information.

## How it Should Work

The Direct Mail Offer Lookup System should:

- Allow authorized users to upload CSV and XLSX files containing property offer data.
- Provide an autocomplete feature for property search.
- Enable updating offer values for existing records.
- Maintain an accurate, searchable database of property offers.
- Handle large datasets efficiently.

## User Experience Goals

- Provide a user-friendly interface for managing property offers.
- Ensure quick and easy access to property information.
- Minimize data entry errors through validation and autocomplete features.
- Provide clear feedback on system operations, such as file uploads and search results.
```

### memory-bank\progress.md

- Size: 5.6 KB
- Modified: 2025-03-17 19:03:54

```md
# Progress

## What Works

Backend Core:

- Created project repository with proper .gitignore and README
- Initialized backend project structure using Express.js
- Set up TypeScript configuration for type safety
- Configured ESLint and Prettier for code quality
- Set up Jest for unit testing with coverage reporting
- Configured environment variables using dotenv
- Set up logging infrastructure with Winston
- Implemented standardized async handler pattern
- Enhanced type safety across route handlers

Authentication & Security:

- Implemented JWT-based authentication system
- Created role-based authorization middleware
- Set up user login, registration, and logout endpoints
- Integrated bcrypt password hashing
- Added input validation with express-validator
- Enhanced server security with Helmet, rate limiting, and CORS

Data Management:

- Created SQL migration scripts for database schema with proper indexes
- Configured database connection pooling with Sequelize and retry mechanisms
- Implemented Redis service for caching and session management
- Set up cache invalidation strategies for data consistency
- Created Sequelize ORM models with validation rules:
  - User Model: With role-based permissions and secure password handling
  - Property Model: With address field validation and normalization
  - UploadJob Model: With job status tracking and progress reporting
  - ActivityLog Model: With comprehensive audit capabilities

File Processing:

- Implemented upload-middleware.ts using Multer
- Added file type validation and size limits
- Set up temporary and processed file storage
- Enhanced FileProcessorService with:
  - Repository integration for data persistence
  - Observer Pattern for real-time progress tracking
  - Support for both CSV and XLSX file formats
  - Batch processing for efficiency with large files

API Layer:

- Created comprehensive API routes with role-based access
- Implemented property-controller.ts for CRUD operations
- Created upload-controller.ts for file handling
- Added proper error handling and logging throughout controllers
- Standardized async/await error handling
- Implemented type-safe route handlers

Repository Layer:

- Implemented Repository Pattern for data access:
  - BaseRepository: Generic implementation for common CRUD operations
  - UserRepository: User-specific queries and authentication helpers
  - PropertyRepository: Address-based deduplication and search
  - UploadJobRepository: Job management and statistics
  - ActivityLogRepository: Audit logging and reporting

Development Environment:

- Created Docker configuration for development
- Set up development Dockerfiles for both frontend and backend
- Initialized frontend project using React and TypeScript

## What Works (New Additions)

Backend:

- Stats API fully implemented with Redis caching:
  - System overview statistics
  - Property statistics by state
  - Property statistics by city
  - User activity statistics
  - Upload statistics
- Batch property operations:
  - Batch update for modifying multiple properties
  - Batch create for importing new properties
  - Proper validation for batch operations
  - Comprehensive error handling and reporting
- Database initialization scripts:
  - Table creation with proper constraints
  - Index creation for optimized queries
  - Trigger setup for automatic timestamp updates
  - Sample data creation for testing
- API Documentation:
  - Swagger/OpenAPI specification
  - Interactive documentation UI
  - Endpoint descriptions and examples
  - Request/response schema definitions
- Type Safety Improvements:
  - Standardized async handler pattern
  - Enhanced route handler type safety
  - Improved error propagation
  - Consistent controller return types

## What's Left to Build

Backend Tasks:

- Write unit tests for controllers and services
- Create integration tests for API endpoints
- Create migration scripts for schema updates
- Document deployment procedures
- Set up CI/CD pipeline for automated testing
- Add type coverage reporting
- Implement error boundary testing

Frontend tasks remain unchanged.

## Current Status

Backend Progress:

- Core authentication and authorization system implemented
- File upload processing system in place with progress tracking
- Data access layer established with Repository Pattern
- Redis caching integrated for performance optimization
- API endpoints created for core functionality
- Security measures implemented including JWT, input validation, and rate limiting
- Type safety improvements implemented across route handlers
- Standardized async/await error handling pattern established

Frontend Progress:

- Project initialized with React and TypeScript
- Development environment configured with Docker
- Ready for component development

## Known Issues

Performance:

- Need to optimize Redis caching strategies for specific use cases
- Potential bottlenecks with concurrent large file uploads
- Database query optimization needed for complex searches

Security:

- Need to implement additional rate limiting for specific endpoints
- Required security audit for JWT implementation
- CORS configuration needs review for production

Testing:

- Lack of comprehensive test coverage
- Need integration tests for critical paths
- Required load testing for file upload system
- Type safety test coverage needed
- Error boundary testing required

Frontend:

- Need to implement client-side validations
- Required error handling strategy for API interactions
- Performance optimization needed for large datasets
```

### memory-bank\projectbrief.md

- Size: 680.0 B
- Modified: 2025-03-17 08:09:32

```md
# Project Brief

## Project Name

Direct Mail Offer Lookup System

## Core Requirements

The system must:

- Manage and search property offer data.
- Allow authorized users to upload CSV and XLSX files.
- Provide an autocomplete feature for property search.
- Enable updating offer values for existing records.
- Maintain an accurate, searchable database of property offers.
- Handle large datasets (over 100,000 rows) efficiently.

## Goals

- Streamline the management of property offers.
- Reduce data entry errors.
- Provide quick access to offer information.

## Success Metrics

- Upload processing time.
- Search response time.
- System uptime.
```

### memory-bank\systemPatterns.md

- Size: 4.7 KB
- Modified: 2025-03-17 19:04:01

```md
# System Patterns

## System Architecture

The application follows a layered architecture with well-defined components:

- **Frontend Layer**: React application with Material-UI, TypeScript, Redux for state management, and React Query for data fetching.
- **Backend Layer**: Node.js with Express, TypeScript, JWT authentication, role-based authorization, input validation, file upload handling, and comprehensive error handling.
- **Data Layer**: PostgreSQL for persistent data storage, Redis for caching, and Sequelize ORM for database operations.
- **Infrastructure Layer**: Docker for containerization, Nginx for reverse proxy and SSL termination, and Winston for logging.

## Key Technical Decisions

- Using TypeScript across the stack for type safety and better developer experience.
- Implementing JWT-based authentication for stateless, scalable auth.
- Using Redis for caching to improve performance of frequently accessed data.
- Implementing Repository Pattern to abstract data access and improve maintainability.
- Using Docker for consistent development and deployment environments.
- Implementing comprehensive logging and monitoring.
- Using Sequelize ORM for type-safe database operations.
- Implementing role-based access control for security.

## Design Patterns

**Backend Patterns:**

- Repository Pattern: Abstracts data access logic with BaseRepository and specific repositories.
- Strategy Pattern: Handles different file formats (CSV, XLSX) and authentication methods.
- Observer Pattern: Tracks file upload progress and notifies clients.
- Decorator Pattern: Enhances base functionality with additional features.
- Factory Pattern: Creates different types of data processors.
- Singleton Pattern: Manages database and Redis connections.
- Command Pattern: Logs and tracks data modifications.
- Batch Processing Pattern: Efficiently handles large datasets.
- Retry Pattern: Implements exponential backoff for database operations.
- Middleware Pattern: Processes requests through validation and auth checks.
- Async Handler Pattern: Standardizes error handling in async routes.

**Data Access Patterns:**

- Connection Pool Pattern: Manages database connections efficiently.
- Cache-Aside Pattern: Implements Redis caching for frequent data.
- Query Optimization Pattern: Uses proper indexing and execution plans.
- Specification Pattern: Validates data before processing.

**Security Patterns:**

- JWT Authentication Pattern: Implements stateless authentication.
- Role-Based Access Control: Manages user permissions.
- Input Validation Pattern: Prevents injection attacks.
- Rate Limiting Pattern: Controls API access.
- Password Hashing Pattern: Secures user credentials with bcrypt.

**Error Handling Patterns:**

- Error Handler Pattern: Centralizes error processing.
- Circuit Breaker Pattern: Handles service failures gracefully.
- Logging Pattern: Tracks system events and errors.
- Type-Safe Error Pattern: Ensures consistent error handling across routes.

## Component Relationships

- **Frontend**: React components communicate with the backend API using Axios for data fetching and updates. The frontend provides the user interface for property searching, data uploading, and system monitoring. It handles user authentication and authorization, displaying data and providing feedback to the user.
- **Backend**: Express.js handles API requests, interacts with PostgreSQL using Sequelize ORM, and utilizes Redis for caching and session management.
- **Data**: PostgreSQL stores persistent data, while Redis caches frequently accessed data to improve performance.
- **Infrastructure**: Docker containers encapsulate the application, Nginx acts as a reverse proxy, and Winston provides logging.

## Security Measures

- JWT-based authentication and role-based authorization protect API endpoints.
- Input validation middleware prevents injection attacks.
- Rate limiting controls API access.
- Secure HTTP headers enhance security.

## Scalability and Performance

- Redis caching improves response times for frequently accessed data.
- Connection pooling optimizes database performance.
- Batch processing handles large file uploads efficiently.
- Docker containers enable horizontal scaling.

## Type Safety Patterns

- Request Handler Pattern: Ensures type safety in Express route handlers.
- Controller Pattern: Standardizes async/await error handling.
- Repository Pattern: Provides type-safe data access methods.
- Validation Pattern: Type-safe request body validation.

### Async Error Handling Pattern

- All async controllers must use try/catch blocks
- Errors must be passed via next() to centralized handler
- Route wrappers ensure proper type compliance
```

### memory-bank\techContext.md

- Size: 2.8 KB
- Modified: 2025-03-17 19:03:58

```md
# Tech Context

## Technologies Used

**Frontend:**

- React.js
- Material-UI
- Axios
- React Query
- React Hook Form
- Redux Toolkit

**Backend:**

- Node.js with Express
- TypeScript
- Sequelize ORM
- JWT (jsonwebtoken)
- Multer
- ExcelJS and CSV-parser
- Winston
- Express-Winston
- Express-Validator
- Bcrypt

**Database:**

- PostgreSQL
- Redis

**Deployment:**

- Docker
- Docker Compose
- Nginx

## Development Setup

- TypeScript for type safety
- ESLint and Prettier for code quality
- Jest for unit testing
- Docker for consistent environments

## Technical Constraints

- On-premises deployment
- Limited server resources (8GB RAM, 4 CPU cores)
- Database size limit (50GB)
- 8-week development timeline

## Dependencies

**Backend Dependencies:**

- express
- winston
- express-winston
- dotenv
- typescript
- eslint
- prettier
- eslint-config-prettier
- jest
- supertest
- @types/express
- @types/jest
- @types/node
- ts-node
- @types/winston
- sequelize
- pg
- pg-hstore
- jsonwebtoken
- multer
- exceljs
- csv-parser
- bcrypt
- express-validator

**Frontend Dependencies:**

- react
- react-dom
- react-router-dom
- @mui/material
- @emotion/react
- @emotion/styled
- @mui/icons-material
- axios
- react-query
- react-hook-form
- yup
- @hookform/resolvers
- react-toastify
- react-loading-overlay
- ag-grid-community
- ag-grid-react
- typescript
- @types/react
- @types/react-dom
- eslint
- prettier
- eslint-config-prettier
- vite
- @vitejs/plugin-react
- @reduxjs/toolkit
- react-redux

## Tech Context Updates

New dependencies:

- swagger-ui-express
- swagger-jsdoc

Updated TypeScript configuration:

- Added resolveJsonModule for JSON imports
- Enabled esModuleInterop for better module compatibility

## Async Handling Strategy

- Express type definitions require void returns for RequestHandlers
- Controllers must use `Promise<void>` return types
- Error handling through `next()` propagation
- Standardized async handler pattern:

```typescript
const wrapAsync = (
  fn: (req: Request, res: Response) => Promise<any>
): RequestHandler => {
  return (req, res, next) => void fn(req, res).catch(next);
};
```

## Type Safety Improvements

- Added strict type checking for route handlers
- Implemented proper error propagation in async functions
- Enhanced type definitions for Express middleware
- Standardized response type handling across controllers

## Async Handling Strategy

- Express type definitions require void returns for RequestHandlers
- Controllers must use `Promise<void>` return types
- Error handling through `next()` propagation
- Approved pattern:

```typescript
const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```
```

## Summary

- Total files processed: 59
- File extensions included: .cpp, .hpp, .html, .js, .tsx, .java, .py, .ts, .css, .jsx, .md, .h
- Ignored patterns: .git, node_modules, __pycache__, .env, .venv, venv, env, .idea, .vscode, dist, build, .cache
