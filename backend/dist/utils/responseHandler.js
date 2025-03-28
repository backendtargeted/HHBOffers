"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const dataTransformer_1 = require("./dataTransformer");
const logger_1 = __importDefault(require("../logger"));
/**
 * Standard response handler that ensures consistent response format and camelCase transformation
 * @param res Express Response object
 * @param data Data to send in response
 * @param statusCode HTTP status code (default: 200)
 */
const sendResponse = (res, data, statusCode = 200) => {
    // Transform all data to camelCase
    const transformedData = (0, dataTransformer_1.toCamelCase)(data);
    // Log transformed data for verification
    logger_1.default.debug(`[ResponseHandler] Transformed response: ${JSON.stringify(transformedData)}`);
    // Always wrap with success flag for consistent structure
    const responseBody = Object.assign({ success: statusCode >= 200 && statusCode < 300 }, transformedData);
    res.status(statusCode).json(responseBody);
};
exports.sendResponse = sendResponse;
