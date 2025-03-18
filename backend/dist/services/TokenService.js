"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
class TokenService {
    static generateAccessToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role,
            email: user.email
        }, environment_1.env.JWT_SECRET, { expiresIn: environment_1.env.JWT_EXPIRATION });
    }
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
    }
    static getTokenFromHeaders(headers) {
        const authHeader = headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return null;
    }
}
exports.TokenService = TokenService;
