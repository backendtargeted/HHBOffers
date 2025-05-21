"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferHistory = exports.ActivityLog = exports.UploadJob = exports.Property = void 0;
exports.initializeModelAssociations = initializeModelAssociations;
const Property_1 = require("./Property");
Object.defineProperty(exports, "Property", { enumerable: true, get: function () { return Property_1.Property; } });
const OfferHistory_1 = require("./OfferHistory");
Object.defineProperty(exports, "OfferHistory", { enumerable: true, get: function () { return OfferHistory_1.OfferHistory; } });
const UploadJob_1 = require("./UploadJob");
Object.defineProperty(exports, "UploadJob", { enumerable: true, get: function () { return UploadJob_1.UploadJob; } });
const ActivityLog_1 = require("./ActivityLog");
Object.defineProperty(exports, "ActivityLog", { enumerable: true, get: function () { return ActivityLog_1.ActivityLog; } });
// Initialize all models and their associations
function initializeModelAssociations(sequelizeInstance) {
    // Initialize models
    Property_1.Property.init(Property_1.PropertyModelAttributes, Object.assign(Object.assign({}, Property_1.PropertyModelOptions), { sequelize: sequelizeInstance }));
    OfferHistory_1.OfferHistory.init(OfferHistory_1.OfferHistoryModelAttributes, {
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
    });
    UploadJob_1.UploadJob.init(UploadJob_1.UploadJobModelAttributes, Object.assign(Object.assign({}, UploadJob_1.UploadJobModelOptions), { sequelize: sequelizeInstance }));
    ActivityLog_1.ActivityLog.init(ActivityLog_1.ActivityLogModelAttributes, Object.assign(Object.assign({}, ActivityLog_1.ActivityLogModelOptions), { sequelize: sequelizeInstance }));
    // Initialize associations after all models are initialized
    (0, Property_1.initializeAssociations)();
    (0, OfferHistory_1.initializeAssociations)();
}
// Export default as an object with all models
exports.default = {
    Property: Property_1.Property,
    UploadJob: UploadJob_1.UploadJob,
    ActivityLog: ActivityLog_1.ActivityLog,
    OfferHistory: OfferHistory_1.OfferHistory
};
