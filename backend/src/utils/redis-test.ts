// backend/src/utils/redis-test.ts
import { redisService } from '../services/redis-service';
import logger from '../logger';

/**
 * Simple test script to verify Redis connection
 */
async function testRedisConnection() {
  try {
    // Log environment variables (without sensitive info)
    logger.info(`Redis connection environment: 
      REDIS_HOST: ${process.env.REDIS_HOST || 'not set'}
      REDIS_PORT: ${process.env.REDIS_PORT || 'not set'}
    `);
    
    // Try to set a value
    await redisService.set('test-key', 'test-value', 60);
    logger.info('Successfully set test value in Redis');
    
    // Try to get the value
    const value = await redisService.get('test-key');
    logger.info(`Successfully retrieved test value from Redis: ${value}`);
    
    // Delete the test value
    await redisService.delete('test-key');
    logger.info('Successfully deleted test value from Redis');
    
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
}

// Export the test function
export default testRedisConnection;