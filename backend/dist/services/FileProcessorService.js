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
const OfferHistoryRepository_1 = require("../repositories/OfferHistoryRepository");
const redis_service_1 = require("./redis-service");
const logger_1 = __importDefault(require("../logger"));
/**
 * Service for processing CSV and XLSX files using the Batch Processing Pattern
 * This implementation focuses on efficiency when dealing with large files
 */
class FileProcessorService {
    constructor() {
        this.BATCH_SIZE = 100; // Process 100 records at a time
        this.stream = null;
        // Observer Pattern implementation
        this.progressObservers = new Map();
    }
    /**
     * Process a CSV file using the Batch Processing Pattern with non-blocking behavior
     * @param filePath Path to the CSV file
     * @param jobId Unique identifier for this processing job
     * @param headerMapping Optional header mapping object
     * @param defaultOfferDate Optional default offer date to use if no date is provided in the file
     * @returns Promise with processing statistics
     */
    processCsvFile(filePath, jobId, headerMapping, defaultOfferDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update job status to processing
            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'processing');
            return new Promise((resolve, reject) => {
                const stats = {
                    totalRecords: 0,
                    newRecords: 0,
                    updatedRecords: 0,
                    errorRecords: 0
                };
                let batch = [];
                let batchCount = 0;
                let headers = []; // Added to store headers
                let firstRow = true; // Added flag for first row
                this.stream = fs_1.default.createReadStream(filePath)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => {
                    // Capture headers from the first row if needed
                    if (firstRow) {
                        headers = Object.keys(row);
                        firstRow = false;
                        // If no explicit mapping is provided, try to detect common patterns
                        if (!headerMapping) {
                            const detectedMapping = {};
                            headers.forEach(header => {
                                const lowerHeader = header.toLowerCase();
                                if (lowerHeader.includes('first') && lowerHeader.includes('name'))
                                    detectedMapping.firstName = header;
                                else if (lowerHeader.includes('last') && lowerHeader.includes('name'))
                                    detectedMapping.lastName = header;
                                else if (lowerHeader.includes('address') || lowerHeader === 'addr')
                                    detectedMapping.propertyAddress = header;
                                else if (lowerHeader.includes('city'))
                                    detectedMapping.propertyCity = header;
                                else if (lowerHeader.includes('state'))
                                    detectedMapping.propertyState = header;
                                else if (lowerHeader.includes('zip'))
                                    detectedMapping.propertyZip = header;
                                else if (lowerHeader.includes('offer') || lowerHeader.includes('price') || lowerHeader === 'amount')
                                    detectedMapping.offerAmount = header;
                                else if (lowerHeader.includes('date'))
                                    detectedMapping.offerDate = header;
                            });
                            headerMapping = detectedMapping;
                        }
                    }
                    batch.push(row);
                    stats.totalRecords++;
                    // When batch size is reached, process the batch
                    if (batch.length >= this.BATCH_SIZE) {
                        // Pause the stream to prevent memory overflow
                        this.stream.pause();
                        // Process the batch in a non-blocking way
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            try {
                                // Pass headerMapping and defaultOfferDate to processBatch
                                const batchStats = yield this.processBatch(batch, jobId, headerMapping, defaultOfferDate);
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
                                this.stream.resume(); // Resume despite error to continue processing
                            }
                        }), 0);
                    }
                })
                    .on('end', () => __awaiter(this, void 0, void 0, function* () {
                    // Process any remaining records
                    if (batch.length > 0) {
                        try {
                            // Pass headerMapping and defaultOfferDate to processBatch
                            const batchStats = yield this.processBatch(batch, jobId, headerMapping, defaultOfferDate);
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
                    yield this.updateJobProgress(jobId, stats);
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'completed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
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
     * Process an XLSX file using the Batch Processing Pattern with non-blocking behavior
     * @param filePath Path to the XLSX file
     * @param jobId Unique identifier for this processing job
     * @param headerMapping Optional header mapping object
     * @param defaultOfferDate Optional default offer date to use if no date is provided in the file
     * @returns Promise with processing statistics
     */
    processXlsxFile(filePath, jobId, headerMapping, defaultOfferDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update job status to processing
            yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'processing');
            // Log activity
            yield ActivityLogRepository_1.activityLogRepository.log({
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
                    // Get header row
                    const headerRow = worksheet.getRow(1);
                    const headers = [];
                    headerRow.eachCell((cell, colNumber) => {
                        var _a;
                        headers[colNumber - 1] = ((_a = cell.value) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                    });
                    // If no explicit mapping is provided, try to detect common patterns
                    if (!headerMapping) {
                        const detectedMapping = {};
                        headers.forEach(header => {
                            const lowerHeader = header.toLowerCase();
                            if (lowerHeader.includes('first') && lowerHeader.includes('name'))
                                detectedMapping.firstName = header;
                            else if (lowerHeader.includes('last') && lowerHeader.includes('name'))
                                detectedMapping.lastName = header;
                            else if (lowerHeader.includes('address') || lowerHeader === 'addr')
                                detectedMapping.propertyAddress = header;
                            else if (lowerHeader.includes('city'))
                                detectedMapping.propertyCity = header;
                            else if (lowerHeader.includes('state'))
                                detectedMapping.propertyState = header;
                            else if (lowerHeader.includes('zip'))
                                detectedMapping.propertyZip = header;
                            else if (lowerHeader.includes('offer') || lowerHeader.includes('price') || lowerHeader === 'amount')
                                detectedMapping.offerAmount = header;
                            else if (lowerHeader.includes('date'))
                                detectedMapping.offerDate = header;
                        });
                        headerMapping = detectedMapping;
                    }
                    // Collect all rows first to enable batch processing
                    const allRows = [];
                    // Skip header row (starting from 2)
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        if (rowNumber === 1)
                            return; // Skip header
                        const rowData = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
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
                        yield new Promise((batchResolve) => {
                            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    // Pass headerMapping and defaultOfferDate to processBatch
                                    const batchStats = yield this.processBatch(batch, jobId, headerMapping, defaultOfferDate);
                                    this.updateStats(stats, batchStats);
                                    // Update progress in database
                                    yield this.updateJobProgress(jobId, stats);
                                    // Emit progress event
                                    this.emitProgress(jobId, stats);
                                    logger_1.default.info(`[Job ${jobId}] Processed batch ${++batchCount}: ` +
                                        `${batchStats.newRecords} new, ${batchStats.updatedRecords} updated, ${batchStats.errorRecords} errors`);
                                    batchResolve();
                                }
                                catch (error) {
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                    logger_1.default.error(`[Job ${jobId}] Error processing batch ${batchCount}:`, errorMessage);
                                    batchResolve(); // Resolve despite error to continue processing
                                }
                            }), 0);
                        });
                    }
                    logger_1.default.info(`[Job ${jobId}] Processing completed: ` +
                        `${stats.totalRecords} total, ${stats.newRecords} new, ${stats.updatedRecords} updated, ${stats.errorRecords} errors`);
                    // Update job status to completed
                    yield this.updateJobProgress(jobId, stats);
                    yield UploadJobRepository_1.uploadJobRepository.updateStatus(jobId, 'completed');
                    // Log activity
                    yield ActivityLogRepository_1.activityLogRepository.log({
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
     * Process a batch of records in batches of 100
     * @param batch Array of records to process
     * @param jobId Unique identifier for this processing job
     * @param headerMapping Optional header mapping object
     * @param defaultOfferDate Optional default offer date to use if no date is provided in the file
     * @returns Promise with batch processing statistics
     */
    processBatch(batch, jobId, headerMapping, defaultOfferDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = {
                totalRecords: batch.length,
                newRecords: 0,
                updatedRecords: 0,
                errorRecords: 0
            };
            // Track property IDs that had offers added for cache invalidation
            const propertiesWithOffers = new Set();
            // Use a transaction for the entire batch
            const transaction = yield PropertyRepository_1.propertyRepository.startTransaction();
            try {
                // Transform all records first, passing the headerMapping and defaultOfferDate
                const transformedData = batch.map(row => this.transformRowToPropertyData(row, headerMapping, defaultOfferDate));
                // Process each record individually to handle offer history
                for (const data of transformedData) {
                    try {
                        // Find or create property
                        const [property, isNew] = yield PropertyRepository_1.propertyRepository.createOrUpdate(data.propertyData, transaction);
                        // Add log for debugging offerAmount and offerDate
                        logger_1.default.info('[OfferHistory] Checking data:', {
                            propertyId: property.id,
                            propertyAddress: property.property_address,
                            offerAmount: data.offerAmount,
                            offerAmountType: typeof data.offerAmount,
                            offerDate: data.offerDate
                        });
                        // Create offer history if offer amount and date are present
                        if (data.offerAmount !== undefined && data.offerDate) {
                            logger_1.default.info(`[FileProcessorService] Creating offer for property ${property.id}:`, {
                                propertyAddress: property.property_address,
                                offerAmount: data.offerAmount,
                                offerDate: data.offerDate
                            });
                            try {
                                yield OfferHistoryRepository_1.offerHistoryRepository.addOffer({
                                    propertyId: property.id,
                                    offerAmount: data.offerAmount,
                                    offerDate: data.offerDate
                                }, transaction);
                                // Track this property for cache invalidation
                                propertiesWithOffers.add(property.id);
                                logger_1.default.info(`[FileProcessorService] Successfully created offer for property ${property.id}`);
                            }
                            catch (error) {
                                logger_1.default.error(`[FileProcessorService] Error creating offer for property ${property.id}:`, error);
                                throw error; // Re-throw to trigger transaction rollback
                            }
                        }
                        else {
                            logger_1.default.info(`[FileProcessorService] Skipping offer creation for property ${property.id} - missing data:`, {
                                hasOfferAmount: data.offerAmount !== undefined,
                                hasOfferDate: !!data.offerDate
                            });
                        }
                        // Update stats
                        if (isNew) {
                            stats.newRecords++;
                        }
                        else {
                            stats.updatedRecords++;
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`[Job ${jobId}] Error processing record:`, error);
                        stats.errorRecords++;
                    }
                }
                yield transaction.commit();
                // Invalidate cache for properties that had offers added (after successful commit)
                if (propertiesWithOffers.size > 0) {
                    const cacheInvalidationPromises = Array.from(propertiesWithOffers).map(propertyId => {
                        const cacheKey = `property:${propertyId}:offers`;
                        logger_1.default.debug(`[FileProcessorService] Invalidating cache for property ${propertyId}`);
                        return redis_service_1.redisService.delete(cacheKey).catch(error => {
                            logger_1.default.error(`[FileProcessorService] Error invalidating cache for property ${propertyId}:`, error);
                        });
                    });
                    yield Promise.all(cacheInvalidationPromises);
                    logger_1.default.info(`[FileProcessorService] Invalidated cache for ${propertiesWithOffers.size} properties`);
                }
            }
            catch (error) {
                yield transaction.rollback();
                stats.errorRecords = batch.length;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.default.error(`[Job ${jobId}] Batch error:`, errorMessage);
            }
            return stats;
        });
    }
    /**
     * Transform a raw data row into a PropertyCreationAttributes object and offer data
     * This method handles data normalization and validation
     * @param row Raw data row
     * @param headerMapping Optional header mapping object
     * @param defaultOfferDate Optional default offer date to use if no date is provided in the file
     * @returns Transformed data object containing property data and offer information
     */
    transformRowToPropertyData(row, headerMapping, defaultOfferDate) {
        // Debug log the raw row data
        logger_1.default.info('[FileProcessorService] Raw CSV row:', row);
        // Use the mapping if provided, otherwise use default field names
        const mapping = headerMapping || {
            firstName: 'First Name',
            lastName: 'Last Name',
            propertyAddress: 'ADDRESS',
            propertyCity: 'CITY',
            propertyState: 'STATE',
            propertyZip: 'ZIP',
            offerAmount: 'Offer',
            offerDate: 'Offer Date'
        };
        // Debug log the header mapping
        logger_1.default.info('[FileProcessorService] Using header mapping:', mapping);
        // Helper function to safely get value using mapping or fallbacks
        const getValue = (fieldKey, fallbacks) => {
            const mappedHeader = mapping[fieldKey];
            if (mappedHeader && row[mappedHeader] !== undefined) {
                logger_1.default.info(`[FileProcessorService] Found value for ${fieldKey} using mapped header ${mappedHeader}:`, row[mappedHeader]);
                return row[mappedHeader];
            }
            for (const fallback of fallbacks) {
                if (row[fallback] !== undefined) {
                    logger_1.default.info(`[FileProcessorService] Found value for ${fieldKey} using fallback ${fallback}:`, row[fallback]);
                    return row[fallback];
                }
            }
            logger_1.default.info(`[FileProcessorService] No value found for ${fieldKey}`);
            return null;
        };
        // Extract and normalize property data using the mapping safely
        const propertyData = {
            first_name: getValue('firstName', ['first_name']),
            last_name: getValue('lastName', ['last_name']),
            property_address: this.normalizeAddress(getValue('propertyAddress', ['property_address', 'address']) || ''),
            property_city: this.normalizeCity(getValue('propertyCity', ['property_city', 'city']) || ''),
            property_state: this.normalizeState(getValue('propertyState', ['property_state', 'state']) || ''),
            property_zip: this.normalizeZip(getValue('propertyZip', ['property_zip', 'zip']) || ''),
            created_at: new Date(),
            updated_at: new Date()
        };
        // Extract offer data - keep as string
        const rawOfferAmount = getValue('offer', ['estimated_offer', 'Offer', 'offer_amount', 'offer', 'amount', 'Offer Amount', 'OFFER AMOUNT']);
        let offerAmount;
        if (rawOfferAmount !== null && rawOfferAmount !== '') {
            // Keep the original string format, just trim whitespace
            offerAmount = String(rawOfferAmount).trim();
            logger_1.default.info(`[FileProcessorService] Raw offer amount: "${rawOfferAmount}", processed to: "${offerAmount}"`);
        }
        let offerDate = getValue('offerDate', ['offer_date', 'date', 'Offer Date', 'OFFER DATE']);
        if (offerDate) {
            logger_1.default.info(`[FileProcessorService] Found offer date: "${offerDate}"`);
        }
        // If no offer date is found in the file and a default date is provided, use it
        if (!offerDate && defaultOfferDate) {
            offerDate = defaultOfferDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            logger_1.default.info(`[FileProcessorService] Using default offer date: "${offerDate}"`);
        }
        const result = {
            propertyData,
            offerAmount,
            offerDate: offerDate || undefined
        };
        logger_1.default.info(`[FileProcessorService] Transformed row data:`, {
            propertyAddress: result.propertyData.property_address,
            offerAmount: result.offerAmount,
            offerDate: result.offerDate
        });
        return result;
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
