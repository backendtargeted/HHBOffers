"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth-routes"));
const property_routes_1 = __importDefault(require("./property-routes"));
const upload_routes_1 = __importDefault(require("./upload-routes"));
const stats_routes_1 = __importDefault(require("./stats-routes"));
const docs_routes_1 = __importDefault(require("./docs-routes"));
const logger_1 = __importDefault(require("../logger"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (_req, res) => {
    return res.status(200).json({
        status: 'UP',
        timestamp: new Date(),
        services: {
            api: 'UP',
            database: 'UP',
            redis: 'UP'
        }
    });
});
// API Documentation
router.use('/docs', docs_routes_1.default);
// Routes
router.use('/auth', auth_routes_1.default);
router.use('/properties', property_routes_1.default);
router.use('/upload', upload_routes_1.default);
router.use('/stats', stats_routes_1.default);
// 404 handler for API routes
router.use('*', (_req, res) => {
    logger_1.default.warn(`404 - Not Found: ${_req.originalUrl}`);
    return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});
exports.default = router;
