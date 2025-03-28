"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Import routes and middleware
const api_routes_1 = __importDefault(require("./routes/api-routes"));
const logger_1 = __importDefault(require("./logger"));
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Apply middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use((0, cors_1.default)()); // Enable CORS
app.use((0, compression_1.default)()); // Compress responses
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Apply rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});
app.use(limiter);
// Request logging middleware
app.use((req, _res, next) => {
    logger_1.default.info(`${req.method} ${req.originalUrl}`);
    next();
});
// API routes
app.use('/api', api_routes_1.default);
// Global error handler - fixed type declaration
const errorHandler = (err, _req, res, _next) => {
    logger_1.default.error('Unhandled error:', err);
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};
// Apply error handler
app.use(errorHandler);
// Serve static files from the 'public' directory
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Catch-all route to serve index.html for any unmatched routes (for client-side routing)
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Start server
app.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
exports.default = app;
