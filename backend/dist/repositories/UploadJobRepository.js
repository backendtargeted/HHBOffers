"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadJobRepository = void 0;
const sequelize_1 = require("sequelize");
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
const UploadJob_1 = __importDefault(require("../models/UploadJob"));
const User_1 = __importDefault(require("../models/User"));
/**
 * Repository class for UploadJob model
 * Extends BaseRepository with UploadJob-specific query methods
 */
class UploadJobRepository extends BaseRepository_1.default {
    constructor() {
        super(UploadJob_1.default);
    }
    /**
     * Create a new upload job
     * @param jobData - Upload job data
     * @param transaction - Optional transaction
     * @returns Created upload job
     */
    createJob(jobData, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.create(jobData, transaction);
        });
    }
    /**
     * Update job status
     * @param jobId - Job ID
     * @param status - New status
     * @param transaction - Optional transaction
     * @returns Updated job
     */
    updateStatus(jobId, status, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = yield this.findById(jobId);
            if (!job)
                return null;
            job.status = status;
            // If the job is completed or failed, set the completed_at timestamp
            if (status === 'completed' || status === 'failed' || status === 'cancelled') {
                job.completed_at = new Date();
            }
            yield job.save({ transaction });
            return job;
        });
    }
    /**
     * Update job progress
     * @param jobId - Job ID
     * @param stats - Progress statistics
     * @param transaction - Optional transaction
     * @returns Updated job
     */
    updateProgress(jobId, stats, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = yield this.findById(jobId);
            if (!job)
                return null;
            // Using the model's updateProgress method
            return job.updateProgress(stats);
        });
    }
    /**
     * Find jobs by user ID
     * @param userId - User ID
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated jobs for the specified user
     */
    findByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });
        });
    }
    /**
     * Find jobs by status
     * @param status - Job status
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated jobs with the specified status
     */
    findByStatus(status_1) {
        return __awaiter(this, arguments, void 0, function* (status, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { status },
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });
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
    findByUserAndStatus(userId_1, status_1) {
        return __awaiter(this, arguments, void 0, function* (userId, status, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: {
                    user_id: userId,
                    status,
                },
                order: [['created_at', 'DESC']],
            });
        });
    }
    /**
     * Get recent jobs with details
     * @param limit - Maximum number of jobs to return
     * @returns Recent jobs with user details
     */
    getRecentJobs() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            return this.findAll({
                limit,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });
        });
    }
    /**
     * Get job statistics
     * @param days - Number of days to look back
     * @returns Job statistics
     */
    getJobStats() {
        return __awaiter(this, arguments, void 0, function* (days = 30) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            const allJobs = yield this.findAll({
                where: {
                    created_at: {
                        [sequelize_1.Op.gte]: date,
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
                if (job.status === 'completed')
                    stats.completed++;
                else if (job.status === 'failed')
                    stats.failed++;
                else if (job.status === 'pending')
                    stats.pending++;
                else if (job.status === 'processing')
                    stats.processing++;
                else if (job.status === 'cancelled')
                    stats.cancelled++;
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
        });
    }
    /**
     * Cancel a job
     * @param jobId - Job ID
     * @returns Cancelled job
     */
    cancelJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = yield this.findById(jobId);
            if (!job)
                return null;
            // Only pending or processing jobs can be cancelled
            if (job.status !== 'pending' && job.status !== 'processing') {
                return job; // Return the job as is if it can't be cancelled
            }
            return job.cancel();
        });
    }
}
exports.default = UploadJobRepository;
// Export a singleton instance
exports.uploadJobRepository = new UploadJobRepository();
