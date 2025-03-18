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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const repositories_1 = require("../repositories");
const repositories_2 = require("../repositories");
const logger_1 = __importDefault(require("../logger"));
// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
class AuthController {
    /**
     * User login
     * @param req Request object
     * @param res Response object
     */
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Find the user by email
                const user = yield repositories_1.userRepository.findByEmailForAuth(email);
                // If user not found or password is incorrect
                if (!user || !(yield user.comparePassword(password))) {
                    logger_1.default.warn(`Failed login attempt for email: ${email}`);
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({
                    id: user.id,
                    email: user.email,
                    role: user.role
                }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
                // Update last login time
                yield repositories_1.userRepository.updateLastLogin(user.id);
                // Log successful login
                yield repositories_2.activityLogRepository.log({
                    user_id: user.id,
                    action: 'login',
                    entity_type: 'auth',
                    details: { email: user.email },
                    ip_address: req.ip
                });
                // Return success with token and user info
                return res.status(200).json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Login error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error during login process'
                });
            }
        });
    }
    /**
     * User registration
     * @param req Request object
     * @param res Response object
     */
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, password } = req.body;
                // Check if user already exists
                const existingUser = yield repositories_1.userRepository.findByEmail(email);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
                // Create new user (password hashing is handled by User model hooks)
                const user = yield repositories_1.userRepository.createUser({
                    name,
                    email,
                    password,
                    role: 'user'
                });
                // Log user creation
                yield repositories_2.activityLogRepository.log({
                    user_id: user.id,
                    action: 'register',
                    entity_type: 'user',
                    entity_id: user.id.toString(),
                    details: { email: user.email },
                    ip_address: req.ip
                });
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({
                    id: user.id,
                    email: user.email,
                    role: user.role
                }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
                // Return success with token and user info
                return res.status(201).json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Registration error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error during registration process'
                });
            }
        });
    }
    /**
     * User logout
     * @param req Request object
     * @param res Response object
     */
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Token invalidation happens on the client side
                // Here we just log the logout event
                // Get user from request (added by auth middleware)
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (userId) {
                    // Log logout
                    yield repositories_2.activityLogRepository.log({
                        user_id: userId,
                        action: 'logout',
                        entity_type: 'auth',
                        ip_address: req.ip
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: 'Logged out successfully'
                });
            }
            catch (error) {
                logger_1.default.error('Logout error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error during logout process'
                });
            }
        });
    }
    /**
     * Get current user profile
     * @param req Request object
     * @param res Response object
     */
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Get user from request (added by auth middleware)
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized'
                    });
                }
                // Find user by ID
                const user = yield repositories_1.userRepository.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                // Return user profile
                return res.status(200).json({
                    success: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        last_login: user.last_login
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Get profile error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error retrieving user profile'
                });
            }
        });
    }
}
exports.default = new AuthController();
