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
exports.propertyRepository = exports.PropertyRepository = void 0;
const sequelize_1 = require("sequelize");
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
const Property_1 = require("../models/Property");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../logger"));
/**
 * Repository class for Property model
 * Extends BaseRepository with Property-specific query methods
 */
class PropertyRepository extends BaseRepository_1.default {
    constructor() {
        super(Property_1.Property);
    }
    /**
     * Find a property by its exact address combination
     * Used for deduplication during imports
     * @param propertyAddress - Street address
     * @param propertyCity - City
     * @param propertyState - State code
     * @param propertyZip - ZIP code
     * @returns Property instance or null
     */
    findByAddressCombination(propertyAddress, propertyCity, propertyState, propertyZip) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`[PropertyRepository] Finding property by address combination: ${propertyAddress}, ${propertyCity}, ${propertyState}, ${propertyZip}`);
            const property = yield this.findOne({
                property_address: propertyAddress,
                property_city: propertyCity,
                property_state: propertyState,
                property_zip: propertyZip,
            });
            logger_1.default.info(`[PropertyRepository] Found property: ${JSON.stringify(property)}`);
            return property;
        });
    }
    /**
     * Search properties by address with autocomplete functionality
     * @param query - Search query string
     * @param limit - Maximum number of results
     * @returns Array of matching properties
     */
    searchByAddress(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10) {
            // Normalize the query to improve matching
            const normalizedQuery = query.trim().toLowerCase();
            const searchQuery = `%${normalizedQuery}%`;
            return this.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { property_address: { [sequelize_1.Op.iLike]: searchQuery } },
                        { property_city: { [sequelize_1.Op.iLike]: searchQuery } },
                        { property_zip: { [sequelize_1.Op.like]: searchQuery } },
                    ],
                },
                limit,
                order: [
                    ['property_city', 'ASC'],
                    ['property_zip', 'ASC'],
                    ['property_address', 'ASC'],
                ],
            });
        });
    }
    /**
     * Create a new property or update if it already exists (address-based deduplication)
     * @param propertyData - Property data
     * @param transaction - Optional transaction
     * @returns Created or updated property instance and a boolean indicating if it was created
     */
    startTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.transaction();
        });
    }
    bulkCreate(records, transaction, updateOnDuplicate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.bulkCreate(records, {
                transaction,
                updateOnDuplicate,
                returning: true
            });
        });
    }
    createOrUpdate(propertyData, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            logger_1.default.info(`[PropertyRepository] createOrUpdate called with propertyData: ${JSON.stringify(propertyData)}`);
            const existingProperty = yield this.findByAddressCombination(propertyData.property_address, propertyData.property_city, propertyData.property_state, propertyData.property_zip);
            if (existingProperty) {
                logger_1.default.info(`[PropertyRepository] Found existing property: ${JSON.stringify(existingProperty)}`);
                const [, updatedProperties] = yield this.update(existingProperty.id, {
                    first_name: propertyData.first_name,
                    last_name: propertyData.last_name,
                    property_address: propertyData.property_address,
                    property_city: propertyData.property_city,
                    property_state: propertyData.property_state,
                    property_zip: propertyData.property_zip,
                    salesforce_id: (_a = propertyData.salesforce_id) !== null && _a !== void 0 ? _a : null,
                }, transaction);
                return [updatedProperties[0] || existingProperty, false];
            }
            logger_1.default.info(`[PropertyRepository] Creating new property: ${JSON.stringify(propertyData)}`);
            const newProperty = yield this.create(propertyData, transaction);
            return [newProperty, true];
        });
    }
    /**
     * Find properties by Salesforce ID
     * Note: salesforce_id is non-unique, so this can return multiple properties
     * @param salesforceId - Salesforce ID to search for
     */
    findBySalesforceId(salesforceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll({
                where: { salesforce_id: salesforceId },
                order: [['updated_at', 'DESC']],
            });
        });
    }
    /**
     * Find properties by ZIP code
     * @param zipCode - ZIP code to search for
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated properties in the specified ZIP code
     */
    findByZipCode(zipCode_1) {
        return __awaiter(this, arguments, void 0, function* (zipCode, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { property_zip: zipCode },
                order: [['property_address', 'ASC']],
            });
        });
    }
    /**
     * Find properties by city
     * @param city - City to search for
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated properties in the specified city
     */
    findByCity(city_1) {
        return __awaiter(this, arguments, void 0, function* (city, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { property_city: { [sequelize_1.Op.iLike]: city } },
                order: [['property_address', 'ASC']],
            });
        });
    }
    /**
     * Find properties by state
     * @param state - State code to search for
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated properties in the specified state
     */
    findByState(state_1) {
        return __awaiter(this, arguments, void 0, function* (state, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { property_state: state.toUpperCase() },
                order: [
                    ['property_city', 'ASC'],
                    ['property_address', 'ASC'],
                ],
            });
        });
    }
    /**
     * Find properties by owner (first and last name)
     * @param name - Owner name to search for
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated properties with the specified owner
     */
    findByOwnerName(name_1) {
        return __awaiter(this, arguments, void 0, function* (name, page = 1, pageSize = 20) {
            const searchQuery = `%${name}%`;
            return this.findPaginated(page, pageSize, {
                where: {
                    [sequelize_1.Op.or]: [
                        { first_name: { [sequelize_1.Op.iLike]: searchQuery } },
                        { last_name: { [sequelize_1.Op.iLike]: searchQuery } },
                    ],
                },
                order: [
                    ['last_name', 'ASC'],
                    ['first_name', 'ASC'],
                ],
            });
        });
    }
    /**
     * Search properties with multiple criteria
     * @param query - Search query string
     * @param limit - Maximum number of results
     * @param offset - Number of results to skip
     * @returns Array of matching properties
     */
    searchProperties(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10, offset = 0) {
            const searchTerms = query.split(' ').filter((term) => term.length > 0);
            const whereConditions = [];
            for (const term of searchTerms) {
                whereConditions.push({
                    [sequelize_1.Op.or]: [
                        { property_address: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { property_city: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { first_name: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { last_name: { [sequelize_1.Op.iLike]: `%${term}%` } }
                    ]
                });
            }
            return this.findAll({
                where: {
                    [sequelize_1.Op.and]: whereConditions
                },
                limit,
                offset,
                order: [['updated_at', 'DESC']]
            });
        });
    }
    /**
     * Count search results for a query string
     * @param query - Search query string
     * @returns Number of matching properties
     */
    countSearchResults(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchTerms = query.split(' ').filter((term) => term.length > 0);
            const whereConditions = [];
            for (const term of searchTerms) {
                whereConditions.push({
                    [sequelize_1.Op.or]: [
                        { property_address: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { property_city: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { first_name: { [sequelize_1.Op.iLike]: `%${term}%` } },
                        { last_name: { [sequelize_1.Op.iLike]: `%${term}%` } }
                    ]
                });
            }
            return this.count({
                where: {
                    [sequelize_1.Op.and]: whereConditions
                }
            });
        });
    }
    /**
     * Get properties added today
     * @returns Count of properties added today
     */
    getPropertiesAddedToday() {
        return __awaiter(this, void 0, void 0, function* () {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return this.count({
                where: {
                    created_at: {
                        [sequelize_1.Op.gte]: todayStart
                    }
                }
            });
        });
    }
    /**
     * Get properties updated today (excluding newly created ones)
     * @returns Count of properties updated today
     */
    getPropertiesUpdatedToday() {
        return __awaiter(this, void 0, void 0, function* () {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return this.count({
                where: {
                    updated_at: {
                        [sequelize_1.Op.gte]: todayStart
                    },
                    created_at: {
                        [sequelize_1.Op.lt]: todayStart
                    }
                }
            });
        });
    }
    getStatsByState() {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.model.findAll({
                attributes: [
                    ['property_state', 'state'],
                    [database_1.default.fn('COUNT', database_1.default.col('id')), 'count'],
                    [
                        database_1.default.literal(`(
            SELECT AVG(offer_amount)
            FROM offer_histories
            WHERE offer_histories.property_id = properties.id
          )`),
                        'avgOffer'
                    ]
                ],
                group: ['property_state'],
                order: [[database_1.default.literal('count'), 'DESC']],
                raw: true
            });
            return stats.map(stat => ({
                state: stat.state || '',
                count: parseInt(stat.count),
                avgOffer: parseFloat(stat.avgOffer) || 0
            }));
        });
    }
    getStatsByCity(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.model.findAll({
                attributes: [
                    'property_city',
                    [database_1.default.fn('COUNT', database_1.default.col('id')), 'count'],
                    [
                        database_1.default.literal(`(
            SELECT AVG(offer_amount)
            FROM offer_histories
            WHERE offer_histories.property_id = properties.id
          )`),
                        'avgOffer'
                    ]
                ],
                where: {
                    property_state: state
                },
                group: ['property_city'],
                order: [[database_1.default.literal('count'), 'DESC']],
                raw: true
            });
            return stats.map(stat => ({
                city: stat.city || '',
                count: parseInt(stat.count),
                avgOffer: parseFloat(stat.avgOffer) || 0
            }));
        });
    }
}
exports.PropertyRepository = PropertyRepository;
// Export a singleton instance
exports.propertyRepository = new PropertyRepository();
