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
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const repositories_1 = require("../repositories");
const repositories_2 = require("../repositories");
const FileProcessorService_1 = __importDefault(require("../services/FileProcessorService"));
const logger_1 = __importDefault(require("../logger"));
// Initialize file processor service
const fileProcessorService = new FileProcessorService_1.default();
// Keep track of active processing jobs
const activeJobs = new Set();
class UploadController {
    /**
     * Upload a file (CSV or XLSX)
     * @param req Request object
     * @param res Response object
     */
    uploadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const userId = req.user.id;
                const originalName = file.originalname;
                const fileSize = file.size;
                const filePath = file.path;
                // Determine file type based on extension
                const fileExtension = path_1.default.extname(originalName).toLowerCase();
                let fileType = '';
                if (fileExtension === '.csv') {
                    fileType = 'csv';
                }
                else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
                    fileType = 'xlsx';
                }
                else {
                    // Delete the uploaded file if it's not a supported type
                    fs_1.default.unlinkSync(filePath);
                    return res.status(400).json({
                        success: false,
                        message: 'Unsupported file type. Only CSV and Excel files are allowed.'
                    });
                }
                // Generate a unique job ID
                const jobId = (0, uuid_1.v4)();
                // Create an upload job record
                const job = yield repositories_1.uploadJobRepository.createJob({
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
                yield repositories_2.activityLogRepository.log({
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
                // Return response immediately with job ID
                // This allows the user to continue using the application
                const response = {
                    success: true,
                    jobId,
                    message: 'File upload started. You can check the status using the job ID.'
                };
                res.status(202).json(response);
                // Start processing in the background, after response has been sent
                // Using setImmediate to ensure this runs in the next event loop iteration
                setImmediate(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Add job to active jobs
                        activeJobs.add(jobId);
                        // Update job status to processing
                        yield repositories_1.uploadJobRepository.updateStatus(jobId, 'processing');
                        // Process the file based on type
                        if (fileType === 'csv') {
                            yield fileProcessorService.processCsvFile(filePath, jobId, userId);
                        }
                        else if (fileType === 'xlsx') {
                            yield fileProcessorService.processXlsxFile(filePath, jobId, userId);
                        }
                        // Move file to processed directory
                        const fileName = path_1.default.basename(filePath);
                        const processedDir = path_1.default.join(path_1.default.dirname(path_1.default.dirname(filePath)), 'processed');
                        // Ensure processed directory exists
                        if (!fs_1.default.existsSync(processedDir)) {
                            fs_1.default.mkdirSync(processedDir, { recursive: true });
                        }
                        const processedFilePath = path_1.default.join(processedDir, fileName);
                        fs_1.default.renameSync(filePath, processedFilePath);
                        logger_1.default.info(`File ${fileName} processed successfully and moved to ${processedFilePath}`);
                        // Remove job from active jobs
                        activeJobs.delete(jobId);
                    }
                    catch (error) {
                        logger_1.default.error(`Error processing file for job ${jobId}:`, error);
                        // Update job status to failed
                        yield repositories_1.uploadJobRepository.updateStatus(jobId, 'failed');
                        // Log error
                        yield repositories_2.activityLogRepository.log({
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
                            if (fs_1.default.existsSync(filePath)) {
                                fs_1.default.unlinkSync(filePath);
                            }
                        }
                        catch (deleteError) {
                            logger_1.default.error(`Error deleting file ${filePath}:`, deleteError);
                        }
                        // Remove job from active jobs
                        activeJobs.delete(jobId);
                    }
                }));
            }
            catch (error) {
                logger_1.default.error('Error uploading file:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading file'
                });
            }
        });
    }
    /**
     * Get job status
     * @param req Request object
     * @param res Response object
     */
    getJobStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { jobId } = req.params;
                // Get job from database
                const job = yield repositories_1.uploadJobRepository.findById(jobId);
                if (!job) {
                    return res.status(404).json({
                        success: false,
                        message: 'Job not found'
                    });
                }
                // Check if user has permission to view this job
                const userId = req.user.id;
                const userRole = req.user.role;
                if (job.user_id !== userId && userRole !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permission to view this job'
                    });
                }
                // Determine if job is currently being processed
                const isActive = activeJobs.has(jobId);
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
                        completedAt: job.completed_at,
                        isActive: isActive
                    }
                });
            }
            catch (error) {
                logger_1.default.error(`Error fetching job status for job ${req.params.jobId}:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching job status'
                });
            }
        });
    }
    /**
     * Cancel a job
     * @param req Request object
     * @param res Response object
     */
    cancelJob(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { jobId } = req.params;
                // Get job from database
                const job = yield repositories_1.uploadJobRepository.findById(jobId);
                if (!job) {
                    return res.status(404).json({
                        success: false,
                        message: 'Job not found'
                    });
                }
                // Check if user has permission to cancel this job
                const userId = req.user.id;
                const userRole = req.user.role;
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
                // Remove job from active jobs
                activeJobs.delete(jobId);
                // Cancel the job
                yield repositories_1.uploadJobRepository.cancelJob(jobId);
                // Log cancellation
                yield repositories_2.activityLogRepository.log({
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
            }
            catch (error) {
                logger_1.default.error(`Error cancelling job ${req.params.jobId}:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error cancelling job'
                });
            }
        });
    }
    /**
     * Get recent jobs for the current user
     * @param req Request object
     * @param res Response object
     */
    getUserJobs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                // Get jobs from database
                const result = yield repositories_1.uploadJobRepository.findByUserId(userId, page, limit);
                // Add active status to each job
                const jobs = result.rows.map(job => (Object.assign(Object.assign({}, job.toJSON()), { isActive: activeJobs.has(job.id) })));
                return res.status(200).json({
                    success: true,
                    jobs,
                    total: result.count,
                    page: result.currentPage,
                    totalPages: result.totalPages
                });
            }
            catch (error) {
                logger_1.default.error('Error fetching user jobs:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching user jobs'
                });
            }
        });
    }
}
const uploadController = new UploadController();
exports.default = uploadController;
