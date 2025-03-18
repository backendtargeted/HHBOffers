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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const repositories_1 = require("../repositories");
const logger_1 = __importDefault(require("../logger"));
const asyncHandler_1 = require("../utils/asyncHandler");
// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
/**
 * Middleware to authenticate user via JWT token
 */
exports.authenticate = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    // Extract token
    const token = authHeader.split(' ')[1];
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Find user by ID from token
        const user = yield repositories_1.userRepository.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token: User not found'
            });
        }
        // Attach user to request for use in other middlewares and route handlers
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.warn('Token verification failed', { error: error.message });
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.default.warn('Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        logger_1.default.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}));
/**
 * Middleware to authorize user by role
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
const authorize = (roles) => {
    return (req, res, next) => {
        // Check if user exists (should be attached by authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Check if user has required role
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            logger_1.default.warn(`Authorization failed for user ${req.user.id}: Role ${userRole} not in ${roles.join(', ')}`);
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorize = authorize;
