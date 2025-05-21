"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyModelOptions = exports.PropertyModelAttributes = exports.Property = void 0;
exports.initializeAssociations = initializeAssociations;
const sequelize_1 = require("sequelize");
const OfferHistory_1 = require("./OfferHistory");
// Define the model
class Property extends sequelize_1.Model {
    // Virtual field for full name
    get fullName() {
        return [this.first_name, this.last_name].filter(Boolean).join(' ') || 'Unknown';
    }
}
exports.Property = Property;
// Define model attributes
exports.PropertyModelAttributes = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    first_name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    last_name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    property_address: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    property_city: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    property_state: {
        type: sequelize_1.DataTypes.CHAR(2),
        allowNull: false,
        validate: {
            notEmpty: true,
            isUppercase: true,
            isIn: [['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
                    'DC', 'PR', 'VI', 'AA', 'AE', 'AP']], // Valid US state/territory codes
        },
    },
    property_zip: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notEmpty: true,
            is: /^[0-9]{4,5}(-[0-9]{4})?$/, // Allow 4 or 5 digits, optionally followed by -4 digits
        },
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
};
// Define model options
exports.PropertyModelOptions = {
    tableName: 'properties',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            // Match the index in the DB schema
            name: 'idx_properties_address',
            fields: ['property_address', 'property_city', 'property_state', 'property_zip'],
        },
    ],
    hooks: {
        beforeUpdate: (property) => {
            property.updated_at = new Date();
        },
    },
};
// Define associations
function initializeAssociations() {
    Property.hasMany(OfferHistory_1.OfferHistory, {
        foreignKey: 'property_id',
        as: 'offerHistories',
    });
}
exports.default = Property;
