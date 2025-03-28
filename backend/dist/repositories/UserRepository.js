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
exports.userRepository = void 0;
const sequelize_1 = require("sequelize");
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../logger"));
/**
 * Repository class for User model
 * Extends BaseRepository with User-specific query methods
 */
class UserRepository extends BaseRepository_1.default {
    constructor() {
        super(User_1.default);
    }
    /**
     * Find a user by email
     * @param email - Email to search for
     * @returns User instance or null
     */
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ email });
        });
    }
    /**
     * Find a user by email and ensure password is included
     * (useful for authentication)
     * @param email - Email to search for
     * @returns User instance or null
     */
    findByEmailForAuth(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info(`Finding user by email for auth: ${email}`);
                return this.model.findOne({
                    where: { email },
                    attributes: { include: ['password'] }
                });
            }
            catch (error) {
                logger_1.default.error(`Error finding user by email for auth: ${email}`, error);
                throw error;
            }
        });
    }
    /**
     * Update a user's last login time
     * @param userId - User ID
     * @returns Updated user instance
     */
    updateLastLogin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findById(userId);
            if (!user)
                return null;
            user.last_login = new Date();
            yield user.save();
            return user;
        });
    }
    /**
     * Find users by role
     * @param role - Role to filter by
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated users with the specified role
     */
    findByRole(role_1) {
        return __awaiter(this, arguments, void 0, function* (role, page = 1, pageSize = 20) {
            return this.findPaginated(page, pageSize, {
                where: { role },
                order: [['name', 'ASC']],
            });
        });
    }
    /**
     * Search users by name or email
     * @param query - Search query
     * @param page - Page number
     * @param pageSize - Page size
     * @returns Paginated search results
     */
    searchUsers(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, page = 1, pageSize = 20) {
            const searchQuery = `%${query}%`;
            return this.findPaginated(page, pageSize, {
                where: {
                    [sequelize_1.Op.or]: [
                        { name: { [sequelize_1.Op.iLike]: searchQuery } },
                        { email: { [sequelize_1.Op.iLike]: searchQuery } },
                    ],
                },
                order: [['name', 'ASC']],
            });
        });
    }
    /**
     * Create a new user with validation
     * @param userData - User data
     * @param transaction - Optional transaction
     * @returns Created user
     */
    createUser(userData, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // Email uniqueness validation is handled by the model
            return this.create(userData, transaction);
        });
    }
    /**
     * Change a user's password
     * @param userId - User ID
     * @param newPassword - New password (will be hashed by model hooks)
     * @returns Success indicator
     */
    changePassword(userId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const [affectedRows] = yield this.update(userId, {
                password: newPassword,
            });
            return affectedRows > 0;
        });
    }
    /**
     * Get active users within a specific period
     * @param days - Number of days to look back
     * @returns User count
     */
    getActiveUserCount() {
        return __awaiter(this, arguments, void 0, function* (days = 7) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            return this.count({
                where: {
                    last_login: {
                        [sequelize_1.Op.gte]: date,
                    },
                },
            });
        });
    }
    /**
     * Get users with upload activity
     * @returns Users with related upload counts
     */
    getUsersWithUploadCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll({
                include: [
                    {
                        association: 'uploadJobs',
                        attributes: [],
                    },
                ],
                attributes: [
                    'id',
                    'name',
                    'email',
                    'role',
                    [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('uploadJobs.id')), 'uploadCount'],
                ],
                group: ['User.id'],
                order: [[(0, sequelize_1.literal)('uploadCount'), 'DESC']],
            });
        });
    }
}
exports.default = UserRepository;
// Export a singleton instance
exports.userRepository = new UserRepository();
