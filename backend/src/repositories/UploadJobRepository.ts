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
