import { QueryTypes } from 'sequelize';
import BaseRepository from './BaseRepository';
import ActivityLog, {ActivityLogCreationAttributes, logActivity } from '../models/ActivityLog';


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
   * Get activity counts grouped by action type
   * @returns Activity counts by action
   */
  async getActivityCountsByUser(): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.model.sequelize!.query(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= :date
    `, {
      replacements: { date: thirtyDaysAgo },
      type: QueryTypes.SELECT
    });
  }

  /**
   * Get recent activity logs
   * @param limit Maximum number of logs to return
   * @returns Recent activity logs
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return this.findAll({
      order: [['created_at', 'DESC']],
      limit
    });
  }
}

// Export a singleton instance
export const activityLogRepository = new ActivityLogRepository();
