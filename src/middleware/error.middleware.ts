/**
 * Error Handling Middleware Module
 * @module errorMiddleware
 * @description Provides custom error classes and central error handling middleware for the application
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.middleware.js';

/**
 * Custom error class for resource not found errors
 * @class NotFoundError
 * @extends Error
 */
class NotFoundError extends Error {
  /**
   * Creates a new NotFoundError instance
   * @param {string} message - The error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for validation errors
 * @class ValidationError
 * @extends Error
 */
class ValidationError extends Error {
  /**
   * Creates a new ValidationError instance
   * @param {string} message - The error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for database operation errors
 * @class DatabaseError
 * @extends Error
 */
class DatabaseError extends Error {
  /**
   * Creates a new DatabaseError instance
   * @param {string} message - The error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Central error handling middleware
 * @function errorHandler
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description
 * Handles all errors thrown during request processing.
 * - Logs detailed error information
 * - Sets appropriate status codes based on error type
 * - Returns standardized error responses
 * - In production, hides implementation details
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error({
    message: 'Error caught by error handler',
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  if (err instanceof NotFoundError) {
    statusCode = 404;
  } else if (err instanceof ValidationError) {
    statusCode = 400;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export { NotFoundError, ValidationError, DatabaseError, errorHandler };
