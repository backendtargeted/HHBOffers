import { Sequelize } from 'sequelize';
import logger from '../logger';

/**
 * Database configuration with connection pooling to mitigate
 * connection failures during high traffic
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'direct_mail_db',
  process.env.DB_USER || 'dbuser',
  process.env.DB_PASSWORD || 'dbpassword',
  {
    host: process.env.DB_HOST || 'postgres', // Use 'postgres' as the host in Docker
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
    pool: {
      max: 10,               // Maximum number of connection in pool
      min: 2,                // Minimum number of connection in pool
      acquire: 30000,        // Maximum time, in milliseconds, that pool will try to get connection before throwing error
      idle: 10000,           // Maximum time, in milliseconds, that a connection can be idle before being released
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
      ],
      max: 5,                // Maximum retries
      backoffBase: 100,      // Initial backoff duration in ms
      backoffExponent: 1.1,  // Exponent to increase backoff each try
    }
  }
);

/**
 * Test the database connection and log the result
 * This runs when the module is first imported
 */
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
})();

export default sequelize;