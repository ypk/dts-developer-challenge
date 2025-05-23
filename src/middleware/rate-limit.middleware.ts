/**
 * Rate Limiting Middleware Module
 * @module rateLimitMiddleware
 * @description Provides rate limiting functionality to protect API endpoints from abuse
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../middleware/logger.middleware.ts';

/**
 * HTTP status codes used for rate limiting responses
 * @enum {number}
 */
export enum HttpStatus {
  TOO_MANY_REQUESTS = 429,
}

/**
 * Time windows for rate limiting in milliseconds
 * @enum {number}
 */
export enum TimeWindow {
  FIFTEEN_MINUTES = 15 * 60 * 1000,
  ONE_HOUR = 60 * 60 * 1000,
}

/**
 * Types of rate limiting strategies
 * @enum {number}
 */
export enum RateLimitType {
  API = 0,
  AUTH = 1,
  SPEED = 2,
}

/**
 * Type definition for storing rate limit data
 * @typedef {Map<string, { count: number; resetTime: number }>} RequestStore
 */
type RequestStore = Map<string, { count: number; resetTime: number }>;

/**
 * Storage for API request rate limiting
 * @type {RequestStore}
 */
export const apiRequestStore: RequestStore = new Map();

/**
 * Storage for authentication request rate limiting
 * @type {RequestStore}
 */
export const authRequestStore: RequestStore = new Map();

/**
 * Storage for speed-based rate limiting
 * @type {RequestStore}
 */
export const speedRequestStore: RequestStore = new Map();

/**
 * Extracts the client IP address from the request
 * @function getClientIp
 * @param {Request} req - Express request object
 * @returns {string} The client's IP address or 'unknown' if not available
 */
export const getClientIp = (req: Request): string => {
  return req.ip || 'unknown';
};

/**
 * Base class for rate limiter implementations
 * @abstract
 * @class BaseRateLimiter
 */
abstract class BaseRateLimiter {
  /**
   * Storage for rate limit data
   * @protected
   * @type {RequestStore}
   */
  protected store: RequestStore;

  /**
   * Time window for rate limiting in milliseconds
   * @protected
   * @type {number}
   */
  protected windowMs: number;

  /**
   * Message to log when rate limit is exceeded
   * @protected
   * @type {string}
   */
  protected logMessage: string;

  /**
   * Creates an instance of BaseRateLimiter
   * @constructor
   * @param {RequestStore} store - Storage for rate limit data
   * @param {number} windowMs - Time window for rate limiting in milliseconds
   * @param {string} logMessage - Message to log when rate limit is exceeded
   */
  constructor(store: RequestStore, windowMs: number, logMessage: string) {
    this.store = store;
    this.windowMs = windowMs;
    this.logMessage = logMessage;
  }

  /**
   * Gets or creates a rate limit entry for an IP address
   * @protected
   * @param {string} ip - Client IP address
   * @returns {{ count: number; resetTime: number }} Rate limit entry
   */
  protected getOrCreateEntry(ip: string): { count: number; resetTime: number } {
    const now = Date.now();

    this.cleanupExpiredEntries();

    let entry = this.store.get(ip);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    return entry;
  }

  /**
   * Removes expired entries from the store
   * @protected
   * @returns {void}
   */
  protected cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Logs a warning when rate limit is exceeded
   * @protected
   * @param {Request} req - Express request object
   * @param {object} [additionalData={}] - Additional data to include in the log
   * @returns {void}
   */
  protected logWarning(req: Request, additionalData: object = {}): void {
    logger.warn({
      message: this.logMessage,
      ip: req.ip,
      method: req.method,
      url: req.url,
      ...additionalData,
    });
  }

  /**
   * Handles the rate limiting logic
   * @abstract
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {void}
   */
  abstract handle(req: Request, res: Response, next: NextFunction): void;
}

/**
 * Standard rate limiter implementation (for API and Auth endpoints)
 * @class StandardRateLimiter
 * @extends {BaseRateLimiter}
 */
class StandardRateLimiter extends BaseRateLimiter {
  /**
   * Maximum number of requests allowed in the time window
   * @private
   * @type {number}
   */
  private maxRequests: number;

  /**
   * Error message to return when rate limit is exceeded
   * @private
   * @type {string}
   */
  private errorMessage: string;

  /**
   * Creates an instance of StandardRateLimiter
   * @constructor
   * @param {RequestStore} store - Storage for rate limit data
   * @param {number} windowMs - Time window for rate limiting in milliseconds
   * @param {string} logMessage - Message to log when rate limit is exceeded
   * @param {number} maxRequests - Maximum number of requests allowed in the time window
   * @param {string} errorMessage - Error message to return when rate limit is exceeded
   */
  constructor(
    store: RequestStore,
    windowMs: number,
    logMessage: string,
    maxRequests: number,
    errorMessage: string,
  ) {
    super(store, windowMs, logMessage);
    this.maxRequests = maxRequests;
    this.errorMessage = errorMessage;
  }

  /**
   * Handles the standard rate limiting logic
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {void}
   */
  handle(req: Request, res: Response, next: NextFunction): void {
    const ip = getClientIp(req);
    const entry = this.getOrCreateEntry(ip);

    if (entry.count >= this.maxRequests) {
      this.logWarning(req);

      this.setRateLimitHeaders(res, entry, 0);

      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: this.errorMessage,
      });
      return;
    }

    entry.count += 1;
    this.store.set(ip, entry);

    this.setRateLimitHeaders(res, entry, this.maxRequests - entry.count);

    next();
  }

  /**
   * Sets rate limit headers on the response
   * @private
   * @param {Response} res - Express response object
   * @param {{ resetTime: number }} entry - Rate limit entry
   * @param {number} remaining - Number of requests remaining
   * @returns {void}
   */
  private setRateLimitHeaders(
    res: Response,
    entry: { resetTime: number },
    remaining: number,
  ): void {
    const resetTime = new Date(entry.resetTime).toISOString();
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime);
  }
}

/**
 * Speed limiter implementation (adds delays to requests)
 * @class SpeedLimiter
 * @extends {BaseRateLimiter}
 */
class SpeedLimiter extends BaseRateLimiter {
  /**
   * Number of requests after which delays are added
   * @private
   * @type {number}
   */
  private delayAfter: number;

  /**
   * Delay in milliseconds to add per request over the threshold
   * @private
   * @type {number}
   */
  private delayMs: number;

  /**
   * Creates an instance of SpeedLimiter
   * @constructor
   * @param {RequestStore} store - Storage for rate limit data
   * @param {number} windowMs - Time window for rate limiting in milliseconds
   * @param {string} logMessage - Message to log when rate limit is exceeded
   * @param {number} delayAfter - Number of requests after which delays are added
   * @param {number} delayMs - Delay in milliseconds to add per request over the threshold
   */
  constructor(
    store: RequestStore,
    windowMs: number,
    logMessage: string,
    delayAfter: number,
    delayMs: number,
  ) {
    super(store, windowMs, logMessage);
    this.delayAfter = delayAfter;
    this.delayMs = delayMs;
  }

  /**
   * Handles the speed limiting logic
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {void}
   */
  handle(req: Request, res: Response, next: NextFunction): void {
    const ip = getClientIp(req);
    const entry = this.getOrCreateEntry(ip);

    const count = entry.count + 1;

    if (count > this.delayAfter) {
      const delay = (count - this.delayAfter) * this.delayMs;

      if (entry.count === this.delayAfter) {
        this.logWarning(req, { hits: count, delayMs: delay });
      }

      entry.count = count;
      this.store.set(ip, entry);

      setTimeout(next, delay);
      return;
    }

    entry.count = count;
    this.store.set(ip, entry);

    next();
  }
}

/**
 * Factory function to create middleware from a rate limiter
 * @function createMiddleware
 * @param {BaseRateLimiter} limiter - Rate limiter instance
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Express middleware function
 */
function createMiddleware(
  limiter: BaseRateLimiter,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    limiter.handle(req, res, next);
  };
}

/**
 * Standard rate limiter for API endpoints
 * @type {StandardRateLimiter}
 * @description Limits to 100 requests per 15 minutes
 */
const apiLimiterInstance = new StandardRateLimiter(
  apiRequestStore,
  TimeWindow.FIFTEEN_MINUTES,
  'Rate limit exceeded',
  100,
  'Too many requests, please try again later.',
);

/**
 * Standard rate limiter for authentication endpoints
 * @type {StandardRateLimiter}
 * @description Limits to 10 requests per hour
 */
const authLimiterInstance = new StandardRateLimiter(
  authRequestStore,
  TimeWindow.ONE_HOUR,
  'Auth rate limit exceeded',
  10,
  'Too many login attempts, please try again later.',
);

/**
 * Speed limiter for general use
 * @type {SpeedLimiter}
 * @description Adds delays after 50 requests within 15 minutes
 */
const speedLimiterInstance = new SpeedLimiter(
  speedRequestStore,
  TimeWindow.FIFTEEN_MINUTES,
  'Speed limit reached - adding delays',
  50,
  100,
);

/**
 * Express middleware for API rate limiting
 * @type {(req: Request, res: Response, next: NextFunction) => void}
 */
export const apiLimiter = createMiddleware(apiLimiterInstance);

/**
 * Express middleware for authentication rate limiting
 * @type {(req: Request, res: Response, next: NextFunction) => void}
 */
export const authLimiter = createMiddleware(authLimiterInstance);

/**
 * Express middleware for speed-based rate limiting
 * @type {(req: Request, res: Response, next: NextFunction) => void}
 */
export const speedLimiter = createMiddleware(speedLimiterInstance);
