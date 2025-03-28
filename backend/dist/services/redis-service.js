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
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../logger"));
// Redis client options
const redisOptions = {
    // url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
    url: `redis://default:redispassword@hhb_redis:6379`,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
};
// Create Redis client
const redisClient = new ioredis_1.default(redisOptions);
// Handle Redis connection events
redisClient.on('connect', () => {
    logger_1.default.info('Connected to Redis');
});
redisClient.on('error', (error) => {
    logger_1.default.error('Redis connection error:', error);
});
redisClient.on('reconnecting', (ms) => {
    logger_1.default.info(`Reconnecting to Redis in ${ms}ms`);
});
/**
 * Redis cache service
 */
class RedisService {
    constructor(redisClient) {
        this.DEFAULT_TTL = 3600; // 1 hour in seconds
        this.client = redisClient;
    }
    /**
     * Set a value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in seconds (optional)
     */
    set(key_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (key, value, ttl = this.DEFAULT_TTL) {
            try {
                const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                yield this.client.set(key, stringValue, 'EX', ttl);
            }
            catch (error) {
                logger_1.default.error('Redis set error:', error);
                throw error;
            }
        });
    }
    /**
     * Get a value from cache
     * @param key Cache key
     * @returns Cached value or null if not found
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const value = yield this.client.get(key);
                if (!value)
                    return null;
                // Try to parse as JSON, return as string if parsing fails
                try {
                    return JSON.parse(value);
                }
                catch (e) {
                    return value;
                }
            }
            catch (error) {
                logger_1.default.error('Redis get error:', error);
                return null;
            }
        });
    }
    /**
     * Delete a value from cache
     * @param key Cache key
     */
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.del(key);
            }
            catch (error) {
                logger_1.default.error('Redis delete error:', error);
                throw error;
            }
        });
    }
    /**
     * Check if a key exists in cache
     * @param key Cache key
     * @returns True if key exists, false otherwise
     */
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.exists(key);
                return result === 1;
            }
            catch (error) {
                logger_1.default.error('Redis exists error:', error);
                return false;
            }
        });
    }
    /**
     * Set multiple values in cache
     * @param keyValuePairs Object with key-value pairs to cache
     * @param ttl Time to live in seconds (optional)
     */
    mset(keyValuePairs_1) {
        return __awaiter(this, arguments, void 0, function* (keyValuePairs, ttl = this.DEFAULT_TTL) {
            try {
                const pipeline = this.client.pipeline();
                for (const [key, value] of Object.entries(keyValuePairs)) {
                    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    pipeline.set(key, stringValue, 'EX', ttl);
                }
                yield pipeline.exec();
            }
            catch (error) {
                logger_1.default.error('Redis mset error:', error);
                throw error;
            }
        });
    }
    /**
     * Get multiple values from cache
     * @param keys Array of cache keys
     * @returns Object with key-value pairs from cache
     */
    mget(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const values = yield this.client.mget(keys);
                return keys.reduce((result, key, index) => {
                    const value = values[index];
                    if (value) {
                        try {
                            result[key] = JSON.parse(value);
                        }
                        catch (e) {
                            result[key] = value;
                        }
                    }
                    else {
                        result[key] = null;
                    }
                    return result;
                }, {});
            }
            catch (error) {
                logger_1.default.error('Redis mget error:', error);
                return {};
            }
        });
    }
    /**
     * Clear cache - USE WITH CAUTION
     */
    clearCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.flushdb();
            }
            catch (error) {
                logger_1.default.error('Redis clearCache error:', error);
                throw error;
            }
        });
    }
    /**
     * Store session data
     * @param sessionId Session ID
     * @param data Session data
     * @param ttl Time to live in seconds (optional)
     */
    setSession(sessionId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, data, ttl = this.DEFAULT_TTL) {
            yield this.set(`session:${sessionId}`, data, ttl);
        });
    }
    /**
     * Get session data
     * @param sessionId Session ID
     * @returns Session data or null if not found
     */
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(`session:${sessionId}`);
        });
    }
    /**
     * Delete session data
     * @param sessionId Session ID
     */
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delete(`session:${sessionId}`);
        });
    }
}
// Export Redis service instance
exports.redisService = new RedisService(redisClient);
// Export Redis client for direct use if needed
exports.default = redisClient;
