"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadErrors = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../logger"));
// Define upload directories
const uploadDir = path_1.default.join(__dirname, '../../uploads');
const tempDir = path_1.default.join(uploadDir, 'temp');
const processedDir = path_1.default.join(uploadDir, 'processed');
// Ensure directories exist
[uploadDir, tempDir, processedDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, tempDir);
    },
    filename: (_req, file, cb) => {
        const uniquePrefix = (0, uuid_1.v4)();
        cb(null, `${uniquePrefix}-${file.originalname}`);
    }
});
// File filter
const fileFilter = (_req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        // Also check by extension
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
        }
    }
};
// Configure multer
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1 // Only allow 1 file at a time
    }
});
// Middleware for handling file upload errors
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the 50MB limit'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file can be uploaded at a time'
            });
        }
        logger_1.default.error('Multer error:', err);
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    }
    else if (err) {
        // Non-Multer error
        logger_1.default.error('Upload error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'File upload failed'
        });
    }
    next();
};
exports.handleUploadErrors = handleUploadErrors;
exports.default = upload;
