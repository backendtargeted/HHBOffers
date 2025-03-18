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
exports.FileProcessorService = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const exceljs_1 = __importDefault(require("exceljs"));
const PropertyRepository_1 = require("../repositories/PropertyRepository");
const UploadJobRepository_1 = require("../repositories/UploadJobRepository");
const ActivityLogRepository_1 = require("../repositories/ActivityLogRepository");
const logger_1 = __importDefault(require("../logger"));
/**
 * Service for processing CSV and XLSX files using the Batch Processing Pattern
 * This implementation focuses on efficiency when dealing with large files
 */
class FileProcessorService {
    constructor() {
        this.BATCH_SIZE = 1000; // Process 1000 records at a time
        this.stream = null;
        // Observer Pattern implementation
        this.progressObservers = new Map();
    }
    /**
     * Process a CSV file using the Batch Processing Pattern
     * @param filePath Path to the CSV file
     * @param jobId Unique identifier for this processing job
     * @param userId ID of the user who initiated the job
     * @returns Promise with processing statistics
     */
    processCsvFile(filePath, jobId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update job status to processing
            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'processing');
            // Log activity
            yield ActivityLogRepository_1.activityLogRepository.log({
                user_id: userId,
                action: 'start_processing',
                entity_type: 'uploadjob',
                entity_id: jobId,
                details: { filePath, fileType: 'csv' }
            });
            return new Promise((resolve, reject) => {
                const stats = {
                    totalRecords: 0,
                    newRecords: 0,
                    updatedRecords: 0,
                    errorRecords: 0
                };
                let batch = [];
                let batchCount = 0;
                this.stream = fs_1.default.createReadStream(filePath)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => __awaiter(this, void 0, void 0, function* () {
                    batch.push(row);
                    stats.totalRecords++;
                    // When batch size is reached, process the batch
                    if (batch.length >= this.BATCH_SIZE) {
                        // Pause the stream to prevent memory overflow
                        this.stream.pause();
                        try {
                            const batchStats = yield this.processBatch(batch, jobId);
                            this.updateStats(stats, batchStats);
                            // Update progress in database
                            yield this.updateJobProgress(jobId, stats);
                            // Emit progress event
                            this.emitProgress(jobId, stats);
                            // Log progress
                            logger_1.default.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                            // Clear the batch array
                            batch = [];
                            // Resume the stream
                            this.stream.resume();
                        }
                        catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            logger_1.default.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
                            reject(error);
                        }
                    }
                }))
                    .on('end', () => __awaiter(this, void 0, void 0, function* () {
                    // Process any remaining records
                    if (batch.length > 0) {
                        try {
                            const batchStats = yield this.processBatch(batch, jobId);
                            this.updateStats(stats, batchStats);
                            yield this.updateJobProgress(jobId, stats);
                            this.emitProgress(jobId, stats);
                            logger_1.default.info(`[Job ${jobId}] Processed final batch ${++batchCount}: ` +
                                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                        }
                        catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            logger_1.default.error(`[Job ${jobId}] Error processing final batch:`, errorMessage);
                            // Update job status to failed
                            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'failed');
                            // Log activity
                            yield ActivityLogRepository_1.activityLogRepository.log({
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
                    logger_1.default.info(`[Job ${jobId}] Processing completed: ` +
                        `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
                    // Update job status to completed
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'completed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
                        user_id: userId,
                        action: 'processing_completed',
                        entity_type: 'uploadjob',
                        entity_id: jobId,
                        details: stats
                    });
                    resolve(stats);
                }))
                    .on('error', (error) => __awaiter(this, void 0, void 0, function* () {
                    logger_1.default.error(`[Job ${jobId}] Stream error:`, error);
                    // Update job status to failed
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'failed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
                        user_id: userId,
                        action: 'processing_failed',
                        entity_type: 'uploadjob',
                        entity_id: jobId,
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });
                    reject(error);
                }));
            });
        });
    }
    /**
     * Process an XLSX file using the Batch Processing Pattern
     * @param filePath Path to the XLSX file
     * @param jobId Unique identifier for this processing job
     * @param userId ID of the user who initiated the job
     * @returns Promise with processing statistics
     */
    processXlsxFile(filePath, jobId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update job status to processing
            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'processing');
            // Log activity
            yield ActivityLogRepository_1.activityLogRepository.log({
                user_id: userId,
                action: 'start_processing',
                entity_type: 'uploadjob',
                entity_id: jobId,
                details: { filePath, fileType: 'xlsx' }
            });
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const stats = {
                    totalRecords: 0,
                    newRecords: 0,
                    updatedRecords: 0,
                    errorRecords: 0
                };
                try {
                    const workbook = new exceljs_1.default.Workbook();
                    yield workbook.xlsx.readFile(filePath);
                    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
                    if (!worksheet) {
                        throw new Error('Worksheet not found');
                    }
                    let batch = [];
                    let batchCount = 0;
                    let rowCount = 0;
                    // Get header row
                    const headerRow = worksheet.getRow(1);
                    const headers = [];
                    headerRow.eachCell((cell, colNumber) => {
                        var _a;
                        headers[colNumber - 1] = ((_a = cell.value) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                    });
                    // Process rows
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => __awaiter(this, void 0, void 0, function* () {
                        // Skip header row
                        if (rowNumber === 1)
                            return;
                        const rowData = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            const header = headers[colNumber - 1];
                            rowData[header] = cell.value;
                        });
                        batch.push(rowData);
                        stats.totalRecords++;
                        rowCount++;
                        // When batch size is reached, process the batch
                        if (batch.length >= this.BATCH_SIZE) {
                            try {
                                const batchStats = yield this.processBatch(batch, jobId);
                                this.updateStats(stats, batchStats);
                                // Update progress in database
                                yield this.updateJobProgress(jobId, stats);
                                // Emit progress event
                                this.emitProgress(jobId, stats);
                                // Log progress
                                logger_1.default.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                                    `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                                batch = [];
                            }
                            catch (error) {
                                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                logger_1.default.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
                                reject(error);
                            }
                        }
                    }));
                    // Process any remaining records
                    if (batch.length > 0) {
                        try {
                            const batchStats = yield this.processBatch(batch, jobId);
                            this.updateStats(stats, batchStats);
                            yield this.updateJobProgress(jobId, stats);
                            this.emitProgress(jobId, stats);
                            logger_1.default.info(`[Job ${jobId}] Processed final batch ${++batchCount}: ` +
                                `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                        }
                        catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            logger_1.default.error(`[Job ${jobId}] Error processing final batch:`, errorMessage);
                            // Update job status to failed
                            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'failed');
                            // Log activity
                            yield ActivityLogRepository_1.activityLogRepository.log({
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
                    logger_1.default.info(`[Job ${jobId}] Processing completed: ` +
                        `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
                    // Update job status to completed
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'completed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
                        user_id: userId,
                        action: 'processing_completed',
                        entity_type: 'uploadjob',
                        entity_id: jobId,
                        details: stats
                    });
                    resolve(stats);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger_1.default.error(`[Job ${jobId}] Error processing XLSX file:`, errorMessage);
                    // Update job status to failed
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'failed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
                        user_id: userId,
                        action: 'processing_failed',
                        entity_type: 'uploadjob',
                        entity_id: jobId,
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });
                    reject(error);
                }
            }));
        });
    }
    /**
     * Process a batch of records
     * @param batch Array of records to process
     * @param jobId Unique identifier for this processing job
     * @returns Promise with batch processing statistics
     */
    processBatch(batch, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = {
                totalRecords: batch.length,
                newRecords: 0,
                updatedRecords: 0,
                errorRecords: 0
            };
            // Process each record in the batch
            for (const row of batch) {
                try {
                    const propertyData = this.transformRowToPropertyData(row);
                    // Create or update property using the repository's createOrUpdate method
                    const [property, isNew] = yield PropertyRepository_1.propertyRepository.createOrUpdate(propertyData);
                    if (isNew) {
                        stats.newRecords++;
                    }
                    else {
                        stats.updatedRecords++;
                    }
                }
                catch (error) {
                    stats.errorRecords++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger_1.default.error(`[Job ${jobId}] Error processing record: ${JSON.stringify(row)}`, errorMessage);
                }
            }
            return stats;
        });
    }
    /**
     * Transform a raw data row into a PropertyCreationAttributes object
     * This method handles data normalization and validation
     * @param row Raw data row
     * @returns Transformed PropertyCreationAttributes object
     */
    transformRowToPropertyData(row) {
        // Extract and normalize property data
        return {
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
    }
    /**
     * Update the overall statistics with batch statistics
     * @param stats Overall statistics to update
     * @param batchStats Batch statistics to add
     */
    updateStats(stats, batchStats) {
        stats.newRecords += batchStats.newRecords;
        stats.updatedRecords += batchStats.updatedRecords;
        stats.errorRecords += batchStats.errorRecords;
    }
    /**
     * Update job progress in the database
     * @param jobId Unique identifier for this processing job
     * @param stats Current processing statistics
     */
    updateJobProgress(jobId, stats) {
        return __awaiter(this, void 0, void 0, function* () {
            yield UploadJobRepository_1.uploadJobRepository.updateProgress(jobId, {
                totalRecords: stats.totalRecords,
                newRecords: stats.newRecords,
                updatedRecords: stats.updatedRecords,
                errorRecords: stats.errorRecords
            });
        });
    }
    /**
     * Register a callback for progress updates
     * @param jobId Job ID to observe
     * @param callback Function to call with progress updates
     */
    onProgress(jobId, callback) {
        if (!this.progressObservers.has(jobId)) {
            this.progressObservers.set(jobId, []);
        }
        this.progressObservers.get(jobId).push(callback);
    }
    /**
     * Remove a progress callback
     * @param jobId Job ID
     * @param callback Function to remove
     */
    offProgress(jobId, callback) {
        if (!this.progressObservers.has(jobId))
            return;
        const observers = this.progressObservers.get(jobId);
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
    emitProgress(jobId, stats) {
        if (!this.progressObservers.has(jobId))
            return;
        for (const callback of this.progressObservers.get(jobId)) {
            try {
                callback(stats);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.default.error(`[Job ${jobId}] Error in progress callback:`, errorMessage);
            }
        }
    }
    // Helper methods for data normalization
    normalizeAddress(address) {
        return address.trim().replace(/\s{2,}/g, ' ');
    }
    normalizeCity(city) {
        return city.trim().replace(/\s{2,}/g, ' ');
    }
    normalizeState(state) {
        return state.trim().toUpperCase();
    }
    normalizeZip(zip) {
        // Extract just the digits for the first 5 digits of the zip code
        const zipDigits = zip.replace(/\D/g, '');
        return zipDigits.substring(0, 5);
    }
}
exports.FileProcessorService = FileProcessorService;
exports.default = FileProcessorService;
