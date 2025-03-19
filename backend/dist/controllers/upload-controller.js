import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { uploadJobRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import FileProcessorService from '../services/FileProcessorService';
import logger from '../logger';
import { exec } from 'child_process';

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
      
      // Send immediate response
      res.status(202).json({
        success: true,
        jobId,
        message: 'File upload started. You can check the status using the job ID.'
      });
      
      // Process in background in a true non-blocking way
      // We're breaking this into small chunks that will be interleaved with other operations
      setImmediate(async () => {
        try {
          // Update job status to processing
          await uploadJobRepository.updateStatus(jobId, 'processing');
          
          // Process each record in small chunks to avoid blocking the event loop
          if (fileType === 'csv') {
            // Start the processing with the CSV method
            await processFileInChunks(filePath, fileType, jobId, userId);
          } else if (fileType === 'xlsx') {
            // Start the processing with the XLSX method
            await processFileInChunks(filePath, fileType, jobId, userId);
          }
        } catch (error) {
          logger.error(`Error initiating file processing for job ${jobId}:`, error);
          
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
        }
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

/**
 * Process file in small chunks to avoid blocking the event loop
 * This function ensures other operations can be handled during processing
 * @param filePath Path to the file
 * @param fileType Type of file (csv or xlsx)
 * @param jobId Unique job ID
 * @param userId User ID
 */
async function processFileInChunks(filePath: string, fileType: string, jobId: string, userId: number) {
  try {
    // We'll use the existing FileProcessorService but ensure proper progress tracking
    // Use a custom strategy that processes in smaller batches with yield points
    
    const BATCH_SIZE = 100; // Smaller batch size to prevent blocking
    
    // Update job status to processing
    await uploadJobRepository.updateStatus(jobId, 'processing');
    
    // Create a wrapper that calls the existing service but in a non-blocking way
    if (fileType === 'csv') {
      // Process CSV - use lower-level functions to process in batches
      await fileProcessorService.processCsvFile(filePath, jobId, userId, BATCH_SIZE);
    } else if (fileType === 'xlsx') {
      // Process XLSX - use lower-level functions to process in batches
      await fileProcessorService.processXlsxFile(filePath, jobId, userId, BATCH_SIZE);
    }
    
    // Move file to processed directory after processing is complete
    const fileName = path.basename(filePath);
    const processedDir = path.join(path.dirname(path.dirname(filePath)), 'processed');
    
    // Ensure processed directory exists
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const processedFilePath = path.join(processedDir, fileName);
    
    fs.renameSync(filePath, processedFilePath);
    
    logger.info(`File ${fileName} processed successfully and moved to ${processedFilePath}`);
    
    // Mark job as completed
    await uploadJobRepository.updateStatus(jobId, 'completed');
    
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

const uploadController = new UploadController();
export default uploadController;