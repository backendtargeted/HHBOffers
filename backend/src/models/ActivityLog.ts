import { Model, DataTypes, Optional } from 'sequelize';

// ActivityLog attributes interface
export interface ActivityLogAttributes {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: object; // JSON data
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Attributes for ActivityLog creation - id and timestamps are optional
export interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'created_at' | 'entity_id' | 'details' | 'ip_address' | 'user_agent'> {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public action!: string;
  public entity_type!: string;
  public entity_id?: string;
  public details?: object;
  public ip_address?: string;
  public user_agent?: string;
  public created_at!: Date;

  // Helper method to get activity type categorization 
  public getActivityCategory(): 'data' | 'upload' | 'system' | 'other' {
    // Categorize activity based on action and entity_type
    if (['create', 'update', 'delete', 'view'].includes(this.action.toLowerCase()) && 
        ['property'].includes(this.entity_type.toLowerCase())) {
      return 'data';
    } else if (this.entity_type.toLowerCase() === 'uploadjob') {
      return 'upload';
    } else if (['system', 'config', 'maintenance'].includes(this.entity_type.toLowerCase())) {
      return 'system';
    } else {
      return 'other';
    }
  }
}

// Define model attributes
export const ActivityLogModelAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  entity_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};

// Define model options
export const ActivityLogModelOptions = {
  modelName: 'ActivityLog',
  tableName: 'audit_logs', // Match the table name in the database schema
  timestamps: false, // We'll only use created_at
  indexes: [
    {
      name: 'idx_activity_logs_entity',
      fields: ['entity_type', 'entity_id'],
    },
    {
      name: 'idx_activity_logs_action',
      fields: ['action'],
    },
    {
      name: 'idx_activity_logs_created_at',
      fields: ['created_at'],
    },
  ],
};

/**
 * Static method to log activity - makes it easier to create new log entries
 */
export const logActivity = async (params: {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: object;
  ip_address?: string;
  user_agent?: string;
}): Promise<ActivityLog> => {
  return await ActivityLog.create({
    ...params,
    created_at: new Date(),
  });
};

export default ActivityLog;
