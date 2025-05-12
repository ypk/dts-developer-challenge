/**
 * Pagination Middleware Module
 * @module paginationMiddleware
 * @description Provides pagination functionality for API endpoints
 */

declare global {
  namespace Express {
    interface Request {
      /**
       * Pagination options attached to the request object
       * @type {PaginationOptions}
       */
      pagination: PaginationOptions;
    }
  }
}

import { Request, Response, NextFunction } from 'express';

/**
 * Interface defining pagination options
 * @interface PaginationOptions
 * @property {number} page - Current page number
 * @property {number} limit - Number of items per page
 * @property {number} skip - Number of items to skip for pagination
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Default page number when not specified
 * @constant {number}
 * @default 1
 */
export const DEFAULT_PAGE = 1;

/**
 * Default limit of items per page when not specified
 * @constant {number}
 * @default 10
 */
export const DEFAULT_LIMIT = 10;

/**
 * Maximum allowed limit of items per page
 * @constant {number}
 * @default 100
 */
export const MAX_LIMIT = 100;

/**
 * Express middleware for handling pagination
 * @function paginationMiddleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description
 * Extracts pagination parameters from query string and attaches them to the request object.
 * Handles validation and applies default values when necessary:
 * - Validates page number (must be >= 1)
 * - Validates limit (must be between 1 and MAX_LIMIT)
 * - Calculates skip value for database queries
 * - Attaches pagination object to request for use in route handlers
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  let limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

  // Ensure page is at least 1
  if (page < 1) {
    page = DEFAULT_PAGE;
    req.query.page = DEFAULT_PAGE.toString();
  }

  // Ensure limit is within acceptable range
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  } else if (limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  // Calculate number of items to skip
  const skip = (page - 1) * limit;

  // Attach pagination object to request
  req.pagination = {
    page,
    limit,
    skip,
  };

  next();
};
