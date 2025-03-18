import User from './User';
import Property from './Property';
import UploadJob from './UploadJob';
import ActivityLog from './ActivityLog';
import sequelize from '../config/database';

// Define associations between models
User.hasMany(UploadJob, {
  sourceKey: 'id',
  foreignKey: 'user_id',
  as: 'uploadJobs'
});

User.hasMany(ActivityLog, {
  sourceKey: 'id',
  foreignKey: 'user_id',
  as: 'activityLogs'
});

// UploadJob belongsTo User association is already defined in UploadJob.ts
// ActivityLog belongsTo User association is already defined in ActivityLog.ts

// Export models
export {
  User,
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};

// Export default as an object with all models
export default {
  User,
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};
