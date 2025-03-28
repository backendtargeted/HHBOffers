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
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../logger"));
/**
 * Database configuration with connection pooling to mitigate
 * connection failures during high traffic
 */
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'direct_mail_db', process.env.DB_USER || 'dbuser', process.env.DB_PASSWORD || 'dbpassword', {
    host: process.env.DB_HOST || 'postgres', // Use 'postgres' as the host in Docker
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger_1.default.debug(msg) : false,
    pool: {
        max: 10, // Maximum number of connection in pool
        min: 2, // Minimum number of connection in pool
        acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
        idle: 10000, // Maximum time, in milliseconds, that a connection can be idle before being released
    },
    retry: {
        match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/,
            /TimeoutError/,
            /ETIMEDOUT/, //added more error types for retry
            /EHOSTUNREACH/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ENOTFOUND/
        ],
        max: 5, // Maximum retries
        backoffBase: 100, // Initial backoff duration in ms
        backoffExponent: 1.1, // Exponent to increase backoff each try
    }
});
/**
 * Test the database connection and log the result
 * This runs when the module is first imported
 */
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        logger_1.default.info('Database connection has been established successfully.');
    }
    catch (error) {
        logger_1.default.error('Unable to connect to the database:', error);
    }
}))();
exports.default = sequelize;
