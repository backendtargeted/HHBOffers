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
