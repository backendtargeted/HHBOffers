import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller function to properly handle errors
 * This solves the TypeScript type mismatch with Express RequestHandler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};