 
 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.middleware.ts';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: 'Error caught by error handler',
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
