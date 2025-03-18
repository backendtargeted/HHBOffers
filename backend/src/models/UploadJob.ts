import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// UploadJob attributes interface
export interface UploadJobAttributes {
  id: string; // UUID
  user_id: number;
  filename: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_records: number;
  new_records: number;
  updated_records: number;
  error_records: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// Attributes for UploadJob creation - id, timestamps, and default values are optional
export interface UploadJobCreationAttributes extends Optional<UploadJobAttributes, 
  'id' | 'created_at' | 'updated_at' | 'completed_at' | 
  'total_records' | 'new_records' | 'updated_records' | 'error_records'> {}

class UploadJob extends Model<UploadJobAttributes, UploadJobCreationAttributes> implements UploadJobAttributes {
  public id!: string;
  public user_id!: number;
  public filename!: string;
  public file_type!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  public total_records!: number;
  public new_records!: number;
  public updated_records!: number;
  public error_records!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public completed_at?: Date;

  // Virtual field for calculating processing time
  public get processingTime(): number | null {
    if (!this.completed_at) return null;
    return Math.floor((this.completed_at.getTime() - this.created_at.getTime()) / 1000); // in seconds
  }

  // Virtual field for calculating success rate
  public get successRate(): number {
    if (this.total_records === 0) return 0;
    return ((this.new_records + this.updated_records) / this.total_records) * 100;
  }

  // Method to update job progress
  public async updateProgress(stats: {
    totalRecords?: number;
    newRecords?: number;
    updatedRecords?: number;
    errorRecords?: number;
  }): Promise<UploadJob> {
    if (stats.totalRecords !== undefined) this.total_records = stats.totalRecords;
    if (stats.newRecords !== undefined) this.new_records = stats.newRecords;
    if (stats.updatedRecords !== undefined) this.updated_records = stats.updatedRecords;
    if (stats.errorRecords !== undefined) this.error_records = stats.errorRecords;
    
    await this.save();
    return this;
  }

  // Method to mark job as completed
  public async markAsCompleted(): Promise<UploadJob> {
    this.status = 'completed';
    this.completed_at = new Date();
    await this.save();
    return this;
  }

  // Method to mark job as failed
  public async markAsFailed(): Promise<UploadJob> {
    this.status = 'failed';
    this.completed_at = new Date();
    await this.save();
    return this;
  }

  // Method to cancel the job
  public async cancel(): Promise<UploadJob> {
    this.status = 'cancelled';
    this.completed_at = new Date();
    await this.save();
    return this;
  }
}

UploadJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    file_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['csv', 'xlsx']],
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'completed', 'failed', 'cancelled']],
      },
    },
    total_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    new_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    updated_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    error_records: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UploadJob',
    tableName: 'upload_jobs',
    timestamps: false, // We'll manually manage created_at and updated_at
    hooks: {
      beforeUpdate: (uploadJob: UploadJob) => {
        uploadJob.updated_at = new Date();
      },
    },
  }
);

// Set up the association with the User model
UploadJob.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UploadJob;
