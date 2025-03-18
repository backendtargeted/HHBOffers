"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../docs/swagger.json"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/docs
 * @desc    Swagger API documentation
 * @access  Public
 */
router.get('/', (req, res) => {
    // Temporary response until swagger is set up
    return res.status(200).json({
        message: 'API Documentation',
        endpoints: [
            { path: '/api/auth/login', method: 'POST', description: 'User login' },
            { path: '/api/auth/register', method: 'POST', description: 'User registration' },
            { path: '/api/properties', method: 'GET', description: 'Get all properties' },
            { path: '/api/properties/search', method: 'GET', description: 'Search properties' },
            { path: '/api/upload', method: 'POST', description: 'Upload file' },
            { path: '/api/stats/system', method: 'GET', description: 'Get system stats' }
        ]
    });
});
router.use('/', swagger_ui_express_1.default.serve);
router.get('/', swagger_ui_express_1.default.setup(swagger_json_1.default, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
    }
}));
exports.default = router;
