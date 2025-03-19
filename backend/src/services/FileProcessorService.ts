import fs from 'fs';
import { Readable } from 'stream';
import csv from 'csv-parser';
import path from 'path';
import Excel from 'exceljs';
import { PropertyCreationAttributes } from '../models/Property';
import { propertyRepository } from '../repositories/PropertyRepository';
import { uploadJobRepository } from '../repositories/UploadJobRepository';
import { activityLogRepository } from '../repositories/ActivityLogRepository';
import logger from '../logger';

// Define interfaces for better type safety
interface ProcessingStats {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errorRecords: number;
}

/**
 * Service for processing CSV and XLSX files using the Batch Processing Pattern
 * This implementation focuses on efficiency when dealing with large files
 */
export class FileProcessorService {
  private readonly BATCH_SIZE = 100; // Process 100 records at a time
  private stream: Readable | null = null;

/** 
 * Process a CSV file using the Batch Processing Pattern with non-blocking behavior
 * @param filePath Path to the CSV file
 * @param jobId Unique identifier for this processing job
 * @param userId ID of the user who initiated the job
 * @returns Promise with processing statistics
 */
async processCsvFile(filePath: string, jobId: string, userId: number): Promise<ProcessingStats> {
  // Update job status to processing
  await uploadJobRepository.updateStatus(jobId, 'processing');
  
  // Log activity
  await activityLogRepository.log({
    user_id: userId,
    action: 'start_processing',
    entity_type: 'uploadjob',
    entity_id: jobId,
    details: { filePath, fileType: 'csv' }
  });
    return new Promise((resolve, reject) => {
      const stats: ProcessingStats = {
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0,
        errorRecords: 0
      };
      
      let batch: any[] = [];
      let batchCount = 0;
      
      this.stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          batch.push(row);
          stats.totalRecords++;
          
          // When batch size is reached, process the batch
          if (batch.length >= this.BATCH_SIZE) {
            // Pause the stream to prevent memory overflow
            this.stream!.pause();
            
            // Process the batch in a non-blocking way
            setTimeout(async () => {
              try {
                const batchStats = await this.processBatch(batch, jobId);
                this.updateStats(stats, batchStats);
                
                // Update progress in database
                await this.updateJobProgress(jobId, stats);
                
                // Emit progress event
                this.emitProgress(jobId, stats);
                
                // Log progress
                logger.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                  `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                
                // Clear the batch array
                batch = [];
                
                // Resume the stream
                this.stream!.resume();
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
                this.stream!.resume(); // Resume despite error to continue processing
              }
            }, 0);
          }
        })
        .on('end', async () => {
          // Process any remaining records
          if (batch.length > 0) {
            try {
              const batchStats = await this.processBatch(batch, jobId);
              this.updateStats(stats, batchStats);
              await this.updateJobProgress(jobId, stats);
              this.emitProgress(jobId, stats);
              
              logger.info(`[Job ${jobId}] Processed final batch ${++batchCount}: ` +
                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger.error(`[Job ${jobId}] Error processing final batch:`, errorMessage);
              
              // Update job status to failed
              await uploadJobRepository.updateStatus(jobId, 'failed');
              
              // Log activity
              await activityLogRepository.log({
                user_id: userId,
                action: 'processing_failed',
                entity_type: 'uploadjob',
                entity_id: jobId,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              });
              
              reject(error);
              return;
            }
          }
          
          logger.info(`[Job ${jobId}] Processing completed: ` +
            `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
          
          // Update job status to completed
          await this.updateJobProgress(jobId, stats);
          await uploadJobRepository.updateStatus(jobId, 'completed');
          
          // Log activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'processing_completed',
            entity_type: 'uploadjob',
            entity_id: jobId,
            details: stats
          });
          
          resolve(stats);
        })
        .on('error', async (error: Error) => {
          logger.error(`[Job ${jobId}] Stream error:`, error);
          
          // Update job status to failed
          await uploadJobRepository.updateStatus(jobId, 'failed');
          
          // Log activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'processing_failed',
            entity_type: 'uploadjob',
            entity_id: jobId,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
          
          reject(error);
        });
    });
  }
  
  /**
   * Process an XLSX file using the Batch Processing Pattern with non-blocking behavior
   * @param filePath Path to the XLSX file
   * @param jobId Unique identifier for this processing job
   * @param userId ID of the user who initiated the job
   * @returns Promise with processing statistics
   */
  async processXlsxFile(filePath: string, jobId: string, userId: number): Promise<ProcessingStats> {
    // Update job status to processing
    await uploadJobRepository.updateStatus(jobId, 'processing');
    
    // Log activity
    await activityLogRepository.log({
      user_id: userId,
      action: 'start_processing',
      entity_type: 'uploadjob',
      entity_id: jobId,
      details: { filePath, fileType: 'xlsx' }
    });
    
    return new Promise(async (resolve, reject) => {
      const stats: ProcessingStats = {
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0,
        errorRecords: 0
      };
      
      try {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1); // Get the first worksheet
        
        if (!worksheet) {
          throw new Error('Worksheet not found');
        }
        
        // Get header row
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        
        headerRow.eachCell((cell: any, colNumber: number) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });
        
        // Collect all rows first to enable batch processing
        const allRows: any[] = [];
        
        // Skip header row (starting from 2)
        worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
          if (rowNumber === 1) return; // Skip header
          
          const rowData: any = {};
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
          });
          
          allRows.push(rowData);
          stats.totalRecords++;
        });
        
        // Process rows in batches
        let batchCount = 0;
        for (let i = 0; i < allRows.length; i += this.BATCH_SIZE) {
          const batch = allRows.slice(i, i + this.BATCH_SIZE);
          
          // Use setTimeout to avoid blocking the main thread
          await new Promise<void>((batchResolve) => {
            setTimeout(async () => {
              try {
                const batchStats = await this.processBatch(batch, jobId);
                this.updateStats(stats, batchStats);
                
                // Update progress in database
                await this.updateJobProgress(jobId, stats);
                
                // Emit progress event
                this.emitProgress(jobId, stats);
                
                logger.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                  `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                
                batchResolve();
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
                batchResolve(); // Resolve despite error to continue processing
              }
            }, 0);
          });
        }
        
        logger.info(`[Job ${jobId}] Processing completed: ` +
          `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
        
        // Update job status to completed
        await this.updateJobProgress(jobId, stats);
        await uploadJobRepository.updateStatus(jobId, 'completed');
        
        // Log activity
        await activityLogRepository.log({
          user_id: userId,
          action: 'processing_completed',
          entity_type: 'uploadjob',
          entity_id: jobId,
          details: stats
        });
        
        resolve(stats);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error processing XLSX file:`, errorMessage);
        
        // Update job status to failed
        await uploadJobRepository.updateStatus(jobId, 'failed');
        
        // Log activity
        await activityLogRepository.log({
          user_id: userId,
          action: 'processing_failed',
          entity_type: 'uploadjob',
          entity_id: jobId,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        
        reject(error);
      }
    });
  }

  /**
   * Process a batch of records in batches of 100
   * @param batch Array of records to process
   * @param jobId Unique identifier for this processing job
   * @returns Promise with batch processing statistics
   */
  private async processBatch(batch: any[], jobId: string): Promise<ProcessingStats> {
    const stats: ProcessingStats = {
      totalRecords: batch.length,
      newRecords: 0,
      updatedRecords: 0,
      errorRecords: 0
    };

    // Use a transaction for the entire batch
    const transaction = await propertyRepository.startTransaction();
    
    try {
      // Transform all records first
      const propertiesData = batch.map(row => this.transformRowToPropertyData(row));

      // Batch create/update using upsert with conflict resolution
      const result = await propertyRepository.bulkCreate(
        propertiesData,
        transaction,
        ['offer', 'updated_at'] as (keyof PropertyCreationAttributes)[]
      );

      // Analyze results to count new/updated records
      result.forEach(property => {
        if (property.created_at.getTime() === property.updated_at.getTime()) {
          stats.newRecords++;
        } else {
          stats.updatedRecords++;
        }
      });

      await transaction.commit();
    } catch (error: unknown) {
      await transaction.rollback();
      stats.errorRecords = batch.length;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Job ${jobId}] Batch error:`, errorMessage);
    }

    return stats;
  }

  /**
   * Transform a raw data row into a PropertyCreationAttributes object
   * This method handles data normalization and validation
   * @param row Raw data row
   * @returns Transformed PropertyCreationAttributes object
   */
  private transformRowToPropertyData(row: any): PropertyCreationAttributes {
    // Extract and normalize property data
    const propertyData: PropertyCreationAttributes = {
      first_name: row.firstName || row.first_name || null,
      last_name: row.lastName || row.last_name || null,
      property_address: this.normalizeAddress(row.propertyAddress || row.property_address || row.address || ''),
      property_city: this.normalizeCity(row.propertyCity || row.property_city || row.city || ''),
      property_state: this.normalizeState(row.propertyState || row.property_state || row.state || ''),
      property_zip: this.normalizeZip(row.propertyZip || row.property_zip || row.zip || ''),
      offer: parseFloat(row.offer || '0'),
      created_at: new Date(),
      updated_at: new Date()
    };
    return propertyData;
  }

  /**
   * Update the overall statistics with batch statistics
   * @param stats Overall statistics to update
   * @param batchStats Batch statistics to add
   */
  private updateStats(stats: ProcessingStats, batchStats: ProcessingStats): void {
    stats.newRecords += batchStats.newRecords;
    stats.updatedRecords += batchStats.updatedRecords;
    stats.errorRecords += batchStats.errorRecords;
  }
  
  /**
   * Update job progress in the database
   * @param jobId Unique identifier for this processing job
   * @param stats Current processing statistics
   */
  private async updateJobProgress(jobId: string, stats: ProcessingStats): Promise<void> {
    await uploadJobRepository.updateProgress(jobId, {
      totalRecords: stats.totalRecords,
      newRecords: stats.newRecords,
      updatedRecords: stats.updatedRecords,
      errorRecords: stats.errorRecords
    });
  }
  
  // Observer Pattern implementation
  private progressObservers: Map<string, Function[]> = new Map();
  
  /**
   * Register a callback for progress updates
   * @param jobId Job ID to observe
   * @param callback Function to call with progress updates
   */
  public onProgress(jobId: string, callback: (stats: ProcessingStats) => void): void {
    if (!this.progressObservers.has(jobId)) {
      this.progressObservers.set(jobId, []);
    }
    
    this.progressObservers.get(jobId)!.push(callback);
  }
  
  /**
   * Remove a progress callback
   * @param jobId Job ID
   * @param callback Function to remove
   */
  public offProgress(jobId: string, callback: Function): void {
    if (!this.progressObservers.has(jobId)) return;
    
    const observers = this.progressObservers.get(jobId)!;
    const index = observers.indexOf(callback);
    
    if (index !== -1) {
      observers.splice(index, 1);
    }
    
    if (observers.length === 0) {
      this.progressObservers.delete(jobId);
    }
  }
  
  /**
   * Emit a progress update to all registered observers
   * @param jobId Job ID
   * @param stats Processing statistics
   */
  private emitProgress(jobId: string, stats: ProcessingStats): void {
    if (!this.progressObservers.has(jobId)) return;
    
    for (const callback of this.progressObservers.get(jobId)!) {
      try {
        callback(stats);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Job ${jobId}] Error in progress callback:`, errorMessage);
      }
    }
  }
  
  // Helper methods for data normalization
  
  private normalizeAddress(address: string): string {
    return address.trim().replace(/\s{2,}/g, ' ');
  }
  
  private normalizeCity(city: string): string {
    return city.trim().replace(/\s{2,}/g, ' ');
  }
  
  private normalizeState(state: string): string {
    return state.trim().toUpperCase();
  }
  
  private normalizeZip(zip: string): string {
    // Extract just the digits for the first 5 digits of the zip code
    const zipDigits = zip.replace(/\D/g, '');
    return zipDigits.substring(0, 5);
  }
}

export default FileProcessorService;
