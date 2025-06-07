import { Sequelize } from 'sequelize';
import logger from '../logger';
import { initializeModelAssociations } from '../models';

/**
 * Database configuration with connection pooling to mitigate
 * connection failures during high traffic
 */
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'dbuser',
  password: process.env.DB_PASSWORD || 'dbpassword',
  database: process.env.DB_NAME || 'hhboffers',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
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
      /ETIMEDOUT/, //added more error types for retry
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ENOTFOUND/       
    ],
    max: 5,                // Maximum retriess
    backoffBase: 100,      // Initial backoff duration in ms
    backoffExponent: 1.1,  // Exponent to increase backoff each try
  }
});

// Initialize model associations with the sequelize instance
initializeModelAssociations(sequelize);

/**
 * Test the database connection and sync models
 * This runs when the module is first imported
 */
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // // Drop and recreate the public schema
    // await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    // await sequelize.query('CREATE SCHEMA public;');
    // await sequelize.query('GRANT ALL ON SCHEMA public TO dbuser;');
    // await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    // logger.info('Database schema reset successfully.');
    
    // Create all tables fresh
    await sequelize.sync({ force: true });
    logger.info('Database tables created successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    // Log more details about the error
    if (error instanceof Error) {
      logger.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
})();

export default sequelize;