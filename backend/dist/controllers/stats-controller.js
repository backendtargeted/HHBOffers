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
const repositories_1 = require("../repositories");
const redis_service_1 = require("../services/redis-service");
const logger_1 = __importDefault(require("../logger"));
/**
 * Controller for statistics and dashboard data
 */
class StatsController {
    /**
     * Get system overview statistics for the dashboard
     * @param req Request object
     * @param res Response object
     */
    getSystemStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to get from cache first
                const cacheKey = 'stats:system';
                const cachedStats = yield redis_service_1.redisService.get(cacheKey);
                if (cachedStats) {
                    return res.status(200).json({
                        success: true,
                        stats: cachedStats,
                        fromCache: true
                    });
                }
                // Gather fresh statistics
                const totalUsers = yield repositories_1.userRepository.count();
                const activeUsers = yield repositories_1.userRepository.getActiveUserCount(7); // Active in last 7 days
                const totalProperties = yield repositories_1.propertyRepository.count();
                const propertiesAddedToday = yield repositories_1.propertyRepository.getPropertiesAddedToday();
                const propertiesUpdatedToday = yield repositories_1.propertyRepository.getPropertiesUpdatedToday();
                // Get upload job statistics
                const uploadStats = yield repositories_1.uploadJobRepository.getJobStats(30); // Last 30 days
                // Get recent activities
                const recentActivities = yield repositories_1.activityLogRepository.getRecentActivity(10);
                // Format response
                const stats = {
                    users: {
                        total: totalUsers,
                        active: activeUsers
                    },
                    properties: {
                        total: totalProperties,
                        addedToday: propertiesAddedToday,
                        updatedToday: propertiesUpdatedToday
                    },
                    uploads: uploadStats,
                    recentActivities: recentActivities.map((activity) => ({
                        id: activity.id,
                        userId: activity.user_id,
                        action: activity.action,
                        entityType: activity.entity_type,
                        entityId: activity.entity_id,
                        timestamp: activity.created_at,
                        details: activity.details
                    }))
                };
                // Cache for 5 minutes
                yield redis_service_1.redisService.set(cacheKey, stats, 300);
                return res.status(200).json({
                    success: true,
                    stats
                });
            }
            catch (error) {
                logger_1.default.error('Error fetching system stats:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching system statistics'
                });
            }
        });
    }
    /**
     * Get property statistics by state
     * @param req Request object
     * @param res Response object
     */
    getPropertyStatsByState(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to get from cache first
                const cacheKey = 'stats:properties:byState';
                const cachedStats = yield redis_service_1.redisService.get(cacheKey);
                if (cachedStats) {
                    return res.status(200).json({
                        success: true,
                        stats: cachedStats,
                        fromCache: true
                    });
                }
                // Get statistics by state
                const statsByState = yield repositories_1.propertyRepository.getStatsByState();
                // Cache for 1 hour
                yield redis_service_1.redisService.set(cacheKey, statsByState, 3600);
                return res.status(200).json({
                    success: true,
                    stats: statsByState
                });
            }
            catch (error) {
                logger_1.default.error('Error fetching property stats by state:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching property statistics by state'
                });
            }
        });
    }
    /**
     * Get property statistics by city for a specific state
     * @param req Request object
     * @param res Response object
     */
    getPropertyStatsByCity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { state } = req.params;
                if (!state || state.length !== 2) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid state code. Must be a 2-letter state code.'
                    });
                }
                // Try to get from cache first
                const cacheKey = `stats:properties:byCity:${state.toUpperCase()}`;
                const cachedStats = yield redis_service_1.redisService.get(cacheKey);
                if (cachedStats) {
                    return res.status(200).json({
                        success: true,
                        stats: cachedStats,
                        fromCache: true
                    });
                }
                // Get statistics by city for the given state
                const statsByCity = yield repositories_1.propertyRepository.getStatsByCity(state);
                // Cache for 1 hour
                yield redis_service_1.redisService.set(cacheKey, statsByCity, 3600);
                return res.status(200).json({
                    success: true,
                    stats: statsByCity
                });
            }
            catch (error) {
                logger_1.default.error(`Error fetching property stats by city for state ${req.params.state}:`, error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching property statistics by city'
                });
            }
        });
    }
    /**
     * Get user activity statistics
     * @param req Request object
     * @param res Response object
     */
    getUserActivityStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to get from cache first
                const cacheKey = 'stats:userActivity';
                const cachedStats = yield redis_service_1.redisService.get(cacheKey);
                if (cachedStats) {
                    return res.status(200).json({
                        success: true,
                        stats: cachedStats,
                        fromCache: true
                    });
                }
                // Get users with upload counts
                const usersWithUploads = yield repositories_1.userRepository.getUsersWithUploadCounts();
                // Get user activity counts by type
                const activityCounts = yield repositories_1.activityLogRepository.getActivityCountsByUser();
                // Format response
                const stats = {
                    usersWithUploads,
                    activityCounts
                };
                // Cache for 1 hour
                yield redis_service_1.redisService.set(cacheKey, stats, 3600);
                return res.status(200).json({
                    success: true,
                    stats
                });
            }
            catch (error) {
                logger_1.default.error('Error fetching user activity stats:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching user activity statistics'
                });
            }
        });
    }
    /**
     * Get upload statistics for the dashboard
     * @param req Request object
     * @param res Response object
     */
    getUploadStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get days parameter (default to 30)
                const days = parseInt(req.query.days) || 30;
                // Try to get from cache first
                const cacheKey = `stats:uploads:${days}`;
                const cachedStats = yield redis_service_1.redisService.get(cacheKey);
                if (cachedStats) {
                    return res.status(200).json({
                        success: true,
                        stats: cachedStats,
                        fromCache: true
                    });
                }
                // Get upload statistics
                const stats = yield repositories_1.uploadJobRepository.getJobStats(days);
                // Cache for 30 minutes
                yield redis_service_1.redisService.set(cacheKey, stats, 1800);
                return res.status(200).json({
                    success: true,
                    stats
                });
            }
            catch (error) {
                logger_1.default.error('Error fetching upload stats:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching upload statistics'
                });
            }
        });
    }
}
exports.default = new StatsController();
