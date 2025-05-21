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
    getJobStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { jobId } = req.params;
                const job = yield repositories_1.uploadJobRepository.findById(jobId);
                if (!job) {
                    return res.status(404).json({
                        success: false,
                        message: 'Job not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    job
                });
            }
            catch (error) {
                logger_1.default.error(`Error getting job status for ${req.params.jobId}:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error getting job status'
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
                const job = yield repositories_1.uploadJobRepository.cancelJob(jobId);
                if (!job) {
                    return res.status(404).json({
                        success: false,
                        message: 'Job not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: 'Job cancelled successfully',
                    job
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
                const originalName = file.originalname;
                const fileSize = file.size;
                const filePath = file.path;
                // Get header mapping if provided
                const headerMapping = req.body.headerMapping ? JSON.parse(req.body.headerMapping) : undefined;
                // Get default offer date if provided
                const defaultOfferDate = req.body.defaultOfferDate ? new Date(req.body.defaultOfferDate) : undefined;
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
                    filename: originalName,
                    file_type: fileType,
                    status: 'pending',
                    total_records: 0,
                    new_records: 0,
                    updated_records: 0,
                    error_records: 0
                });
                // Return response immediately with job ID
                const response = {
                    success: true,
                    jobId,
                    message: 'File upload started. You can check the status using the job ID.'
                };
                res.status(202).json(response);
                // Process in background
                setImmediate(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Add job to active jobs
                        activeJobs.add(jobId);
                        // Update job status to processing
                        yield repositories_1.uploadJobRepository.updateStatus(jobId, 'processing');
                        // Process the file based on type
                        if (fileType === 'csv') {
                            yield fileProcessorService.processCsvFile(filePath, jobId, headerMapping, defaultOfferDate);
                        }
                        else if (fileType === 'xlsx') {
                            yield fileProcessorService.processXlsxFile(filePath, jobId, headerMapping, defaultOfferDate);
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
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        logger_1.default.error(`[Job ${jobId}] Error processing file:`, errorMessage);
                        // Update job status to failed
                        yield repositories_1.uploadJobRepository.updateStatus(jobId, 'failed');
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
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.default.error('Error in uploadFile:', errorMessage);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing file upload'
                });
            }
        });
    }
}
const uploadController = new UploadController();
exports.default = uploadController;
