"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.ActivityLog = exports.UploadJob = exports.Property = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Property_1 = __importDefault(require("./Property"));
exports.Property = Property_1.default;
const UploadJob_1 = __importDefault(require("./UploadJob"));
exports.UploadJob = UploadJob_1.default;
const ActivityLog_1 = __importDefault(require("./ActivityLog"));
exports.ActivityLog = ActivityLog_1.default;
const database_1 = __importDefault(require("../config/database"));
exports.sequelize = database_1.default;
// Define associations between models
User_1.default.hasMany(UploadJob_1.default, {
    sourceKey: 'id',
    foreignKey: 'user_id',
    as: 'uploadJobs'
});
User_1.default.hasMany(ActivityLog_1.default, {
    sourceKey: 'id',
    foreignKey: 'user_id',
    as: 'activityLogs'
});
// Export default as an object with all models
exports.default = {
    User: User_1.default,
    Property: Property_1.default,
    UploadJob: UploadJob_1.default,
    ActivityLog: ActivityLog_1.default,
    sequelize: database_1.default
};
