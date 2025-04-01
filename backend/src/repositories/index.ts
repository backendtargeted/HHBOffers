import BaseRepository from './BaseRepository';
import PropertyRepository, { propertyRepository } from './PropertyRepository';
import UploadJobRepository, { uploadJobRepository } from './UploadJobRepository';
import ActivityLogRepository, { activityLogRepository } from './ActivityLogRepository';

// Export classes
export {
  BaseRepository,
  PropertyRepository,
  UploadJobRepository,
  ActivityLogRepository
};

// Export singleton instances
export {
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};

// Export default as an object with all repositories
export default {
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};
