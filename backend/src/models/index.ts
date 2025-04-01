import Property from './Property';
import UploadJob from './UploadJob';
import ActivityLog from './ActivityLog';
import sequelize from '../config/database';

// Export models
export {
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};

// Export default as an object with all models
export default {
  Property,
  UploadJob,
  ActivityLog,
  sequelize
};
