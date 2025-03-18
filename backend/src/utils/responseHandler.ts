import { Response } from 'express';
import { toCamelCase } from './dataTransformer';
import logger from '../logger';

/**
 * Standard response handler that ensures consistent response format and camelCase transformation
 * @param res Express Response object
 * @param data Data to send in response
 * @param statusCode HTTP status code (default: 200)
 */
export const sendResponse = (
  res: Response, 
  data: any, 
  statusCode: number = 200
): void => {
  // Transform all data to camelCase
  const transformedData = toCamelCase(data);
  
  // Log transformed data for verification
  logger.debug(`[ResponseHandler] Transformed response: ${JSON.stringify(transformedData)}`);

  // Always wrap with success flag for consistent structure
  const responseBody = {
    success: statusCode >= 200 && statusCode < 300,
    ...transformedData
  };

  res.status(statusCode).json(responseBody);
};
