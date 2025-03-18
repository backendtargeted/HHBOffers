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
exports.logActivity = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class ActivityLog extends sequelize_1.Model {
    // Helper method to get activity type categorization 
    getActivityCategory() {
        // Categorize activity based on action and entity_type
        if (['create', 'update', 'delete', 'view'].includes(this.action.toLowerCase()) &&
            ['property', 'user'].includes(this.entity_type.toLowerCase())) {
            return 'data';
        }
        else if (['login', 'logout', 'register', 'password_reset'].includes(this.action.toLowerCase())) {
            return 'auth';
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
ActivityLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
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
}, {
    sequelize: database_1.default,
    modelName: 'ActivityLog',
    tableName: 'audit_logs', // Match the table name in the database schema
    timestamps: false, // We'll only use created_at
    indexes: [
        {
            name: 'idx_activity_logs_user',
            fields: ['user_id'],
        },
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
});
// Set up the association with the User model
ActivityLog.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
/**
 * Static method to log activity - makes it easier to create new log entries
 */
const logActivity = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ActivityLog.create(Object.assign(Object.assign({}, params), { created_at: new Date() }));
});
exports.logActivity = logActivity;
exports.default = ActivityLog;
