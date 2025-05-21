import { Model, DataTypes, Optional } from 'sequelize';
import { Property } from './Property';

// Define the attributes for OfferHistory
interface OfferHistoryAttributes {
  id: number;
  property_id: number;
  offer_amount: number;
  offer_date: Date;
  created_at: Date;
}

// Define the attributes for creating a new OfferHistory
interface OfferHistoryCreationAttributes extends Optional<OfferHistoryAttributes, 'id' | 'created_at'> {}

// Define the model
class OfferHistory extends Model<OfferHistoryAttributes, OfferHistoryCreationAttributes> implements OfferHistoryAttributes {
  public id!: number;
  public property_id!: number;
  public offer_amount!: number;
  public offer_date!: Date;
  public created_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual field for formatted offer date
  public get formattedOfferDate(): string {
    return this.offer_date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
}

// Define model attributes
export const OfferHistoryModelAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id',
    },
  },
  offer_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0, // Offer cannot be negative
    },
  },
  offer_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};

// Define associations
export function initializeAssociations() {
  OfferHistory.belongsTo(Property, {
    foreignKey: 'property_id',
    as: 'property',
  });
}

export { OfferHistory, OfferHistoryAttributes, OfferHistoryCreationAttributes }; 