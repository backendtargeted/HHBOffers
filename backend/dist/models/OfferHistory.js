"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferHistory = exports.OfferHistoryModelAttributes = void 0;
exports.initializeAssociations = initializeAssociations;
const sequelize_1 = require("sequelize");
const Property_1 = require("./Property");
// Define the model
class OfferHistory extends sequelize_1.Model {
    // Virtual field for formatted offer date
    get formattedOfferDate() {
        return this.offer_date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
}
exports.OfferHistory = OfferHistory;
// Define model attributes
exports.OfferHistoryModelAttributes = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    property_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'properties',
            key: 'id',
        },
    },
    offer_amount: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    offer_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
};
// Define associations
function initializeAssociations() {
    OfferHistory.belongsTo(Property_1.Property, {
        foreignKey: 'property_id',
        as: 'property',
    });
}
