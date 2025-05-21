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
exports.activityLogRepository = void 0;
const sequelize_1 = require("sequelize");
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
const ActivityLog_1 = require("../models/ActivityLog");
/**
 * Repository class for ActivityLog model
 * Extends BaseRepository with ActivityLog-specific query methods
 */
class ActivityLogRepository extends BaseRepository_1.default {
    constructor() {
        super(ActivityLog_1.ActivityLog);
    }
    /**
     * Log a new activity
     * @param logData - Activity log data
     * @returns Created activity log
     */
    log(logData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use the logActivity helper from the model
            return (0, ActivityLog_1.logActivity)(logData);
        });
    }
    /**
     * Get activity counts grouped by action type
     * @returns Activity counts by action
     */
    getActivityCountsByUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return this.model.sequelize.query(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= :date
    `, {
                replacements: { date: thirtyDaysAgo },
                type: sequelize_1.QueryTypes.SELECT
            });
        });
    }
    /**
     * Get recent activity logs
     * @param limit Maximum number of logs to return
     * @returns Recent activity logs
     */
    getRecentActivity() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            return this.findAll({
                order: [['created_at', 'DESC']],
                limit
            });
        });
    }
}
exports.default = ActivityLogRepository;
// Export a singleton instance
exports.activityLogRepository = new ActivityLogRepository();
