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

// Keep track of active processing jobs
const activeJobs: Set<string> = new Set();

class UploadController {
  /**
   * Upload a file (CSV or XLSX)
   * @param req Request object
   * @param res Response object
   */
  async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await uploadJobRepository.findById(jobId);
      
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
    } catch (error) {
      logger.error(`Error getting job status for ${req.params.jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error getting job status'
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
      const job = await uploadJobRepository.cancelJob(jobId);
      
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
    } catch (error) {
      logger.error(`Error cancelling job ${req.params.jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error cancelling job'
      });
    }
  }

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
    const originalName = file.originalname;
    const fileSize = file.size;
    const filePath = file.path;
    
    // Get header mapping if provided
    const headerMapping = req.body.headerMapping ? JSON.parse(req.body.headerMapping) : undefined;
    
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
    setImmediate(async () => {
      try {
        // Add job to active jobs
        activeJobs.add(jobId);
        
        // Update job status to processing
        await uploadJobRepository.updateStatus(jobId, 'processing');
        
        // Process the file based on type
        if (fileType === 'csv') {
          await fileProcessorService.processCsvFile(filePath, jobId, headerMapping);
        } else if (fileType === 'xlsx') {
          await fileProcessorService.processXlsxFile(filePath, jobId, headerMapping);
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
        
        // Remove job from active jobs
        activeJobs.delete(jobId);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error processing file:`, errorMessage);
        
        // Update job status to failed
        await uploadJobRepository.updateStatus(jobId, 'failed');
        
        // Try to delete the file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          logger.error(`Error deleting file ${filePath}:`, deleteError);
        }
        
        // Remove job from active jobs
        activeJobs.delete(jobId);
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

}

const uploadController = new UploadController();
export default uploadController;
