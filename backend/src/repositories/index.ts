import BaseRepository from './BaseRepository';
import UserRepository, { userRepository } from './UserRepository';
import PropertyRepository, { propertyRepository } from './PropertyRepository';
import UploadJobRepository, { uploadJobRepository } from './UploadJobRepository';
import ActivityLogRepository, { activityLogRepository } from './ActivityLogRepository';

// Export classes
export {
  BaseRepository,
  UserRepository,
  PropertyRepository,
  UploadJobRepository,
  ActivityLogRepository
};

// Export singleton instances
export {
  userRepository,
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};

// Export default as an object with all repositories
export default {
  userRepository,
  propertyRepository,
  uploadJobRepository,
  activityLogRepository
};
