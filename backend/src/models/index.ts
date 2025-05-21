import { Sequelize } from 'sequelize';
import { Property, initializeAssociations as initializePropertyAssociations, PropertyModelAttributes, PropertyModelOptions } from './Property';
import { OfferHistory, initializeAssociations as initializeOfferHistoryAssociations, OfferHistoryModelAttributes } from './OfferHistory';
import { UploadJob, UploadJobModelAttributes, UploadJobModelOptions } from './UploadJob';
import { ActivityLog, ActivityLogModelAttributes, ActivityLogModelOptions } from './ActivityLog';

// Initialize all models and their associations
export function initializeModelAssociations(sequelizeInstance: Sequelize) {
  // Initialize models
  Property.init(
    PropertyModelAttributes,
    {
      ...PropertyModelOptions,
      sequelize: sequelizeInstance,
    }
  );

  OfferHistory.init(
    OfferHistoryModelAttributes,
    {
      sequelize: sequelizeInstance,
      tableName: 'offer_histories',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_offer_history_property',
          fields: ['property_id'],
        },
        {
          name: 'idx_offer_history_date',
          fields: ['offer_date'],
        },
      ],
    }
  );

  UploadJob.init(
    UploadJobModelAttributes,
    {
      ...UploadJobModelOptions,
      sequelize: sequelizeInstance,
    }
  );

  ActivityLog.init(
    ActivityLogModelAttributes,
    {
      ...ActivityLogModelOptions,
      sequelize: sequelizeInstance,
    }
  );

  // Initialize associations after all models are initialized
  initializePropertyAssociations();
  initializeOfferHistoryAssociations();
}

// Export models
export {
  Property,
  UploadJob,
  ActivityLog,
  OfferHistory
};

// Export default as an object with all models
export default {
  Property,
  UploadJob,
  ActivityLog,
  OfferHistory
};
