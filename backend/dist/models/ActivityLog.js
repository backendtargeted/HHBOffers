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
exports.logActivity = exports.ActivityLogModelOptions = exports.ActivityLogModelAttributes = exports.ActivityLog = void 0;
const sequelize_1 = require("sequelize");
class ActivityLog extends sequelize_1.Model {
    // Helper method to get activity type categorization 
    getActivityCategory() {
        // Categorize activity based on action and entity_type
        if (['create', 'update', 'delete', 'view'].includes(this.action.toLowerCase()) &&
            ['property'].includes(this.entity_type.toLowerCase())) {
            return 'data';
        }
        else if (this.entity_type.toLowerCase() === 'uploadjob') {
            return 'upload';
        }
        else if (['system', 'config', 'maintenance'].includes(this.entity_type.toLowerCase())) {
            return 'system';
        }
        else {
            return 'other';
        }
    }
}
exports.ActivityLog = ActivityLog;
// Define model attributes
exports.ActivityLogModelAttributes = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    action: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    entity_type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    entity_id: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    details: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    ip_address: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    user_agent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
};
// Define model options
exports.ActivityLogModelOptions = {
    modelName: 'ActivityLog',
    tableName: 'audit_logs', // Match the table name in the database schema
    timestamps: false, // We'll only use created_at
    indexes: [
        {
            name: 'idx_activity_logs_entity',
            fields: ['entity_type', 'entity_id'],
        },
        {
            name: 'idx_activity_logs_action',
            fields: ['action'],
        },
        {
            name: 'idx_activity_logs_created_at',
            fields: ['created_at'],
        },
    ],
};
/**
 * Static method to log activity - makes it easier to create new log entries
 */
const logActivity = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ActivityLog.create(Object.assign(Object.assign({}, params), { created_at: new Date() }));
});
exports.logActivity = logActivity;
exports.default = ActivityLog;
