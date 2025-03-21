// Modified redis-service.ts with in-memory fallback
import Redis from 'ioredis';
import logger from '../logger';

// In-memory cache as fallback
class InMemoryCache {
  private cache: Map<string, { value: string; expiry: number | null }>;
  
  constructor() {
    this.cache = new Map();
    logger.info('Using in-memory cache fallback');
  }
  
  async set(key: string, value: any, ttl: number | null = null): Promise<void> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const expiry = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value: stringValue, expiry });
    
    // Clean up expired items periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }
  
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Try to parse as JSON, return as string if parsing fails
    try {
      return JSON.parse(item.value);
    } catch (e) {
      return item.value;
    }
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key) && this.get(key) !== null;
  }
  
  async clearCache(): Promise<void> {
    this.cache.clear();
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Redis client options
const redisOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // Only add password if it's provided in environment variables
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

// Create in-memory fallback
const inMemoryCache = new InMemoryCache();

// Initialize Redis client and connection status
let redisClient: Redis | null = null;
let isRedisAvailable = false;
let isCheckingConnection = false;

// Function to safely initialize Redis
const initializeRedis = (): Redis | null => {
  try {
    return new Redis(redisOptions);
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    return null;
  }
};

// Try to initialize Redis client
redisClient = initializeRedis();

// Check Redis connection
const checkRedisConnection = async (): Promise<boolean> => {
  if (isCheckingConnection) return isRedisAvailable;
  
  isCheckingConnection = true;
  
  try {
    if (!redisClient) {
      redisClient = initializeRedis();
      if (!redisClient) {
        isRedisAvailable = false;
        isCheckingConnection = false;
        return false;
      }
    }
    
    await redisClient.ping();
    
    if (!isRedisAvailable) {
      logger.info('Redis connection established');
    }
    
    isRedisAvailable = true;
  } catch (error) {
    if (isRedisAvailable) {
      logger.error('Redis connection lost:', error);
    } else {
      logger.warn('Redis unavailable, using in-memory fallback');
    }
    
    isRedisAvailable = false;
  } finally {
    isCheckingConnection = false;
  }
  
  return isRedisAvailable;
};

// Handle Redis connection events if client exists
if (redisClient) {
  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
    isRedisAvailable = true;
  });

  redisClient.on('error', (error: Error) => {
    logger.error('Redis connection error:', error);
    isRedisAvailable = false;
  });

  redisClient.on('reconnecting', (ms: number) => {
    logger.info(`Reconnecting to Redis in ${ms}ms`);
  });
}

// Periodically check Redis connection
setInterval(checkRedisConnection, 10000);

// Initial connection check
checkRedisConnection();

/**
 * Redis cache service with in-memory fallback
 */
class RedisService {
  private DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor() {}

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.set(key, stringValue, 'EX', ttl);
      } else {
        await inMemoryCache.set(key, value, ttl);
      }
    } catch (error) {
      logger.warn('Error setting cache value, using fallback:', error);
      await inMemoryCache.set(key, value, ttl);
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get(key: string): Promise<any> {
    try {
      if (isRedisAvailable && redisClient) {
        const value = await redisClient.get(key);
        
        if (!value) return null;
        
        // Try to parse as JSON, return as string if parsing fails
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      } else {
        return await inMemoryCache.get(key);
      }
    } catch (error) {
      logger.warn('Error getting cache value, using fallback:', error);
      return inMemoryCache.get(key);
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.del(key);
      }
      // Always delete from fallback too in case we switch to it
      await inMemoryCache.delete(key);
    } catch (error) {
      logger.warn('Error deleting cache value:', error);
      // Ensure it's deleted from fallback
      await inMemoryCache.delete(key);
    }
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (isRedisAvailable && redisClient) {
        const result = await redisClient.exists(key);
        return result === 1;
      } else {
        return inMemoryCache.exists(key);
      }
    } catch (error) {
      logger.warn('Error checking cache key existence, using fallback:', error);
      return inMemoryCache.exists(key);
    }
  }

  /**
   * Set multiple values in cache
   * @param keyValuePairs Object with key-value pairs to cache
   * @param ttl Time to live in seconds (optional)
   */
  async mset(keyValuePairs: Record<string, any>, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      if (isRedisAvailable && redisClient) {
        const pipeline = redisClient.pipeline();
        
        for (const [key, value] of Object.entries(keyValuePairs)) {
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          pipeline.set(key, stringValue, 'EX', ttl);
        }
        
        await pipeline.exec();
      } else {
        for (const [key, value] of Object.entries(keyValuePairs)) {
          await inMemoryCache.set(key, value, ttl);
        }
      }
    } catch (error) {
      logger.warn('Redis mset error, using fallback:', error);
      // Fall back to in-memory cache
      for (const [key, value] of Object.entries(keyValuePairs)) {
        await inMemoryCache.set(key, value, ttl);
      }
    }
  }

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Object with key-value pairs from cache
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      if (isRedisAvailable && redisClient) {
        const values = await redisClient.mget(keys);
        
        return keys.reduce((result, key, index) => {
          const value = values[index];
          
          if (value) {
            try {
              result[key] = JSON.parse(value);
            } catch (e) {
              result[key] = value;
            }
          } else {
            result[key] = null;
          }
          
          return result;
        }, {} as Record<string, any>);
      } else {
        // Use fallback to get individual values
        const result: Record<string, any> = {};
        for (const key of keys) {
          result[key] = await inMemoryCache.get(key);
        }
        return result;
      }
    } catch (error) {
      logger.warn('Redis mget error, using fallback:', error);
      // Fall back to in-memory cache
      const result: Record<string, any> = {};
      for (const key of keys) {
        result[key] = await inMemoryCache.get(key);
      }
      return result;
    }
  }

  /**
   * Clear cache - USE WITH CAUTION
   */
  async clearCache(): Promise<void> {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.flushdb();
      }
      await inMemoryCache.clearCache();
    } catch (error) {
      logger.warn('Redis clearCache error:', error);
      await inMemoryCache.clearCache();
    }
  }
  
  /**
   * Store session data
   * @param sessionId Session ID
   * @param data Session data
   * @param ttl Time to live in seconds (optional)
   */
  async setSession(sessionId: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  /**
   * Get session data
   * @param sessionId Session ID
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  /**
   * Delete session data
   * @param sessionId Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }
}

// Export Redis service instance
export const redisService = new RedisService();

// Export Redis client for direct use if needed
export default redisClient;