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
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
/**
 * Base Repository class that implements common CRUD operations
 * This class serves as the foundation for all other repositories
 * in the application, following the Repository Pattern for data access abstraction
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    /**
     * Find a record by its primary key
     * @param id - The primary key value
     * @param options - Additional find options
     * @returns The found record or null
     */
    findById(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, options = {}) {
            return this.model.findByPk(id, options);
        });
    }
    /**
     * Find a single record based on where conditions
     * @param where - The where conditions
     * @param options - Additional find options
     * @returns The found record or null
     */
    findOne(where_1) {
        return __awaiter(this, arguments, void 0, function* (where, options = {}) {
            return this.model.findOne(Object.assign(Object.assign({}, options), { where }));
        });
    }
    /**
     * Find all records that match the given conditions
     * @param options - Find options including where, order, limit, etc.
     * @returns An array of records
     */
    findAll() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            return this.model.findAll(options);
        });
    }
    /**
     * Count records that match the given conditions
     * @param options - Find options including where
     * @returns The count of matching records
     */
    count() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            return this.model.count(options);
        });
    }
    /**
     * Create a new record
     * @param data - The data to create
     * @param transaction - Optional transaction
     * @returns The created record
     */
    create(data, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.create(data, {
                transaction
            });
        });
    }
    /**
     * Update a record by its primary key
     * @param id - The primary key value
     * @param data - The data to update
     * @param transaction - Optional transaction
     * @returns The number of affected rows
     */
    update(id, data, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // First update the record
            const [affectedRows] = yield this.model.update(data, {
                where: { id },
                transaction,
            });
            // Then fetch the updated record
            const updatedInstance = yield this.model.findByPk(id, { transaction });
            return [affectedRows, updatedInstance ? [updatedInstance] : []];
        });
    }
    /**
     * Update records based on where conditions
     * @param where - The where conditions
     * @param data - The data to update
     * @param transaction - Optional transaction
     * @returns The number of affected rows
     */
    updateWhere(where, data, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.update(data, {
                where,
                transaction,
                returning: true,
            });
        });
    }
    /**
     * Delete a record by its primary key
     * @param id - The primary key value
     * @param transaction - Optional transaction
     * @returns The number of deleted rows
     */
    delete(id, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.destroy({
                where: { id },
                transaction,
            });
        });
    }
    /**
     * Delete records based on where conditions
     * @param where - The where conditions
     * @param transaction - Optional transaction
     * @returns The number of deleted rows
     */
    deleteWhere(where, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.destroy({
                where,
                transaction,
            });
        });
    }
    /**
     * Find records with pagination
     * @param page - The page number (1-based)
     * @param pageSize - The page size
     * @param options - Additional find options
     * @returns An object with rows and count
     */
    findPaginated() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, options = {}) {
            const { count, rows } = yield this.model.findAndCountAll(Object.assign(Object.assign({}, options), { limit: pageSize, offset: (page - 1) * pageSize }));
            return {
                rows,
                count,
                totalPages: Math.ceil(count / pageSize),
                currentPage: page,
            };
        });
    }
    /**
     * Get model instances by multiple IDs
     * @param ids - Array of IDs to fetch
     * @param options - Additional find options
     * @returns Array of found records
     */
    findByIds(ids_1) {
        return __awaiter(this, arguments, void 0, function* (ids, options = {}) {
            if (!ids.length)
                return [];
            return this.model.findAll(Object.assign(Object.assign({}, options), { where: Object.assign(Object.assign({}, options.where), { id: { [sequelize_1.Op.in]: ids } }) }));
        });
    }
    /**
     * Perform a bulk create operation
     * @param records - Array of records to create
     * @param transaction - Optional transaction
     * @returns Array of created records
     */
    bulkCreate(records, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.bulkCreate(records, {
                transaction,
                returning: true,
            });
        });
    }
    /**
     * Check if a record exists by ID
     * @param id - The ID to check
     * @returns Boolean indicating if record exists
     */
    exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.model.count({
                where: { id },
            });
            return count > 0;
        });
    }
    /**
     * Check if records exist based on where conditions
     * @param where - The where conditions
     * @returns Boolean indicating if records exist
     */
    existsWhere(where) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.model.count({ where });
            return count > 0;
        });
    }
}
exports.default = BaseRepository;
