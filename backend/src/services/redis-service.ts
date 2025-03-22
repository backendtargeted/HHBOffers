import Redis from 'ioredis';
import logger from '../logger';

// Redis client options
const redisOptions = {
  // url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
  url: `redis://default:redispassword@hhb_redis:6379`,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

// Create Redis client
const redisClient = new Redis(redisOptions);

// Handle Redis connection events
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
});

redisClient.on('reconnecting', (ms: number) => {
  logger.info(`Reconnecting to Redis in ${ms}ms`);
});

/**
 * Redis cache service
 */
class RedisService {
  private client: Redis;
  private DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor(redisClient: Redis) {
    this.client = redisClient;
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await this.client.set(key, stringValue, 'EX', ttl);
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      
      if (!value) return null;
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   * @param keyValuePairs Object with key-value pairs to cache
   * @param ttl Time to live in seconds (optional)
   */
  async mset(keyValuePairs: Record<string, any>, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        pipeline.set(key, stringValue, 'EX', ttl);
      }
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Redis mset error:', error);
      throw error;
    }
  }

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Object with key-value pairs from cache
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.client.mget(keys);
      
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
    } catch (error) {
      logger.error('Redis mget error:', error);
      return {};
    }
  }

  /**
   * Clear cache - USE WITH CAUTION
   */
  async clearCache(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      logger.error('Redis clearCache error:', error);
      throw error;
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
export const redisService = new RedisService(redisClient);

// Export Redis client for direct use if needed
export default redisClient;
