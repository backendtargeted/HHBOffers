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