 
 
import { Request, Response, NextFunction } from 'express';
import { logger } from '../middleware/logger.middleware.ts';

export enum HttpStatus {
  TOO_MANY_REQUESTS = 429,
}

export enum TimeWindow {
  FIFTEEN_MINUTES = 15 * 60 * 1000,
  ONE_HOUR = 60 * 60 * 1000,
}

export enum RateLimitType {
  API = 0,
  AUTH = 1,
  SPEED = 2,
}

type RequestStore = Map<string, { count: number; resetTime: number }>;

export const apiRequestStore: RequestStore = new Map();
export const authRequestStore: RequestStore = new Map();
export const speedRequestStore: RequestStore = new Map();

export const getClientIp = (req: Request): string => {
  return req.ip || 'unknown';
};

abstract class BaseRateLimiter {
  protected store: RequestStore;
  protected windowMs: number;
  protected logMessage: string;

  constructor(store: RequestStore, windowMs: number, logMessage: string) {
    this.store = store;
    this.windowMs = windowMs;
    this.logMessage = logMessage;
  }

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

  protected cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  protected logWarning(req: Request, additionalData: object = {}): void {
    logger.warn({
      message: this.logMessage,
      ip: req.ip,
      method: req.method,
      url: req.url,
      ...additionalData,
    });
  }

  abstract handle(req: Request, res: Response, next: NextFunction): void;
}

/**
 * Standard rate limiter implementation (for API and Auth endpoints)
 */
class StandardRateLimiter extends BaseRateLimiter {
  private maxRequests: number;
  private errorMessage: string;

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
 */
class SpeedLimiter extends BaseRateLimiter {
  private delayAfter: number;
  private delayMs: number;

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
 */
function createMiddleware(
  limiter: BaseRateLimiter,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    limiter.handle(req, res, next);
  };
}

const apiLimiterInstance = new StandardRateLimiter(
  apiRequestStore,
  TimeWindow.FIFTEEN_MINUTES,
  'Rate limit exceeded',
  100,
  'Too many requests, please try again later.',
);

const authLimiterInstance = new StandardRateLimiter(
  authRequestStore,
  TimeWindow.ONE_HOUR,
  'Auth rate limit exceeded',
  10,
  'Too many login attempts, please try again later.',
);

const speedLimiterInstance = new SpeedLimiter(
  speedRequestStore,
  TimeWindow.FIFTEEN_MINUTES,
  'Speed limit reached - adding delays',
  50,
  100,
);

export const apiLimiter = createMiddleware(apiLimiterInstance);
export const authLimiter = createMiddleware(authLimiterInstance);
export const speedLimiter = createMiddleware(speedLimiterInstance);
