"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Property extends sequelize_1.Model {
}
Property.init({
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
            is: /^[0-9]{5}(-[0-9]{4})?$/, // 5 digit or 5+4 format
        },
    },
    offer: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0, // Offer cannot be negative
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
}, {
    sequelize: database_1.default,
    modelName: 'Property',
    tableName: 'properties',
    timestamps: false, // We'll manually manage created_at and updated_at
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
});
exports.default = Property;
