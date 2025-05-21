import { Request, Response } from 'express';
import { propertyRepository, uploadJobRepository, activityLogRepository } from '../repositories';
import { redisService } from '../services/redis-service';
import logger from '../logger';
import { ActivityLog } from '../models/ActivityLog';

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
      const totalProperties = await propertyRepository.count();
      const propertiesAddedToday = await propertyRepository.getPropertiesAddedToday();
      const propertiesUpdatedToday = await propertyRepository.getPropertiesUpdatedToday();
      
      // Get upload job statistics
      const uploadStats = await uploadJobRepository.getJobStats(30); // Last 30 days
      
      // Get recent activities
      const recentActivities = await activityLogRepository.getRecentActivity(10);
      
      // Format response
      const stats = {
        properties: {
          total: totalProperties,
          addedToday: propertiesAddedToday,
          updatedToday: propertiesUpdatedToday
        },
        uploads: uploadStats,
        recentActivities: recentActivities.map((activity: ActivityLog) => ({
          id: activity.id,
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
