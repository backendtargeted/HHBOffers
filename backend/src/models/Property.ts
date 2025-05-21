import { Model, DataTypes, Optional } from 'sequelize';
import logger from '../logger';
import { OfferHistory } from './OfferHistory';

// Define the attributes for Property
export interface PropertyAttributes {
  id: number;
  first_name: string;
  last_name: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  created_at: Date;
  updated_at: Date;
}

// Define the attributes for creating a new Property
export interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Define the model
export class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: number;
  public first_name!: string;
  public last_name!: string;
  public property_address!: string;
  public property_city!: string;
  public property_state!: string;
  public property_zip!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual field for full name
  public get fullName(): string {
    return [this.first_name, this.last_name].filter(Boolean).join(' ') || 'Unknown';
  }
}

// Define model attributes
export const PropertyModelAttributes = {
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
      is: /^[0-9]{4,5}(-[0-9]{4})?$/, // Allow 4 or 5 digits, optionally followed by -4 digits
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
};

// Define model options
export const PropertyModelOptions = {
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
    beforeUpdate: (property: Property) => {
      property.updated_at = new Date();
    },
  },
};

// Define associations
export function initializeAssociations() {
  Property.hasMany(OfferHistory, {
    foreignKey: 'property_id',
    as: 'offerHistories',
  });
}

export default Property;
