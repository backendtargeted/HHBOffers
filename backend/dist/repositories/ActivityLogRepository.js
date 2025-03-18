"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const ActivityLog_1 = __importStar(require("../models/ActivityLog"));
const User_1 = __importDefault(require("../models/User"));
/**
 * Repository class for ActivityLog model
 * Extends BaseRepository with ActivityLog-specific query methods
 */
class ActivityLogRepository extends BaseRepository_1.default {
    constructor() {
        super(ActivityLog_1.default);
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
   * Get recent activity logs
   * @param limit - Maximum number of logs to return
   * @returns Recent activity logs with user details
   */
    getRecentActivity() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            return this.findAll({
                limit,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User_1.default,
                        as: 'user',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });
        });
    }
    /**
     * Get activity counts grouped by user and action type
     * @returns Activity counts by user and action
     */
    getActivityCountsByUser() {
        return __awaiter(this, void 0, void 0, function* () {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return this.model.sequelize.query(`
      SELECT 
        user_id,
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= :date
      GROUP BY user_id, action
      ORDER BY user_id, count DESC
    `, {
                replacements: { date: thirtyDaysAgo },
                type: sequelize_1.QueryTypes.SELECT
            });
        });
    }
}
exports.default = ActivityLogRepository;
// Export a singleton instance
exports.activityLogRepository = new ActivityLogRepository();
