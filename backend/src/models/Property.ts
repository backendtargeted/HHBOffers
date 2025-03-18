import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import logger from '../logger';

// Property attributes interface
export interface PropertyAttributes {
  id: number;
  first_name?: string;
  last_name?: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  offer: number;
  created_at: Date;
  updated_at: Date;
}

// Attributes for Property creation - id and timestamps are optional
export interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'created_at' | 'updated_at' | 'first_name' | 'last_name'> {}

class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: number;
  public first_name?: string;
  public last_name?: string;
  public property_address!: string;
  public property_city!: string;
  public property_state!: string;
  public property_zip!: string;
  public offer!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Property.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    property_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    property_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    property_state: {
      type: DataTypes.CHAR(2),
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
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[0-9]{5}(-[0-9]{4})?$/, // 5 digit or 5+4 format
      },
    },
    offer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0, // Offer cannot be negative
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
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
      beforeUpdate: (property: Property) => {
        property.updated_at = new Date();
      },
    },
  }
);

logger.info(`Property model initialized with: ${JSON.stringify(Property.getAttributes())}`);

export default Property;
