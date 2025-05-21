"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadJobModelOptions = exports.UploadJobModelAttributes = exports.UploadJob = void 0;
const sequelize_1 = require("sequelize");
class UploadJob extends sequelize_1.Model {
    // Virtual field for calculating processing time
    get processingTime() {
        if (!this.completed_at)
            return null;
        return Math.floor((this.completed_at.getTime() - this.created_at.getTime()) / 1000); // in seconds
    }
    // Virtual field for calculating success rate
    get successRate() {
        if (this.total_records === 0)
            return 0;
        return ((this.new_records + this.updated_records) / this.total_records) * 100;
    }
    // Method to update job progress
    updateProgress(stats) {
        return __awaiter(this, void 0, void 0, function* () {
            if (stats.totalRecords !== undefined)
                this.total_records = stats.totalRecords;
            if (stats.newRecords !== undefined)
                this.new_records = stats.newRecords;
            if (stats.updatedRecords !== undefined)
                this.updated_records = stats.updatedRecords;
            if (stats.errorRecords !== undefined)
                this.error_records = stats.errorRecords;
            yield this.save();
            return this;
        });
    }
    // Method to mark job as completed
    markAsCompleted() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'completed';
            this.completed_at = new Date();
            yield this.save();
            return this;
        });
    }
    // Method to mark job as failed
    markAsFailed() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'failed';
            this.completed_at = new Date();
            yield this.save();
            return this;
        });
    }
    // Method to cancel the job
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = 'cancelled';
            this.completed_at = new Date();
            yield this.save();
            return this;
        });
    }
}
exports.UploadJob = UploadJob;
// Define model attributes
exports.UploadJobModelAttributes = {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    filename: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    file_type: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        validate: {
            isIn: [['csv', 'xlsx']],
        },
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'processing', 'completed', 'failed', 'cancelled']],
        },
    },
    total_records: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    new_records: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    updated_records: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    error_records: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    completed_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
};
// Define model options
exports.UploadJobModelOptions = {
    modelName: 'UploadJob',
    tableName: 'upload_jobs',
    timestamps: false, // We'll manually manage created_at and updated_at
    hooks: {
        beforeUpdate: (uploadJob) => {
            uploadJob.updated_at = new Date();
        },
    },
};
exports.default = UploadJob;
