 
 
 
 
 
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import { logger } from './logger.middleware.ts';

enum RateLimitType {
  API,
  AUTH,
  SPEED,
}

enum TimeWindow {
  FIFTEEN_MINUTES = 15 * 60 * 1000,
  ONE_HOUR = 60 * 60 * 1000,
}

enum HttpStatus {
  TOO_MANY_REQUESTS = 429,
}

interface BaseRateLimitConfig {
  windowMs: number;
  logMessage: string;
}

interface StandardRateLimitConfig extends BaseRateLimitConfig {
  max: number;
  message: string;
}

interface SpeedLimitConfig extends BaseRateLimitConfig {
  delayAfter: number;
  delayIncrement: number;
}

function isStandardRateLimitConfig(config: BaseRateLimitConfig): config is StandardRateLimitConfig {
  return 'max' in config && 'message' in config;
}

function isSpeedLimitConfig(config: BaseRateLimitConfig): config is SpeedLimitConfig {
  return 'delayAfter' in config && 'delayIncrement' in config;
}

const API_RATE_LIMIT_CONFIG: StandardRateLimitConfig = {
  windowMs: TimeWindow.FIFTEEN_MINUTES,
  max: 100,
  message: 'Too many requests, please try again later.',
  logMessage: 'Rate limit exceeded',
};

const AUTH_RATE_LIMIT_CONFIG: StandardRateLimitConfig = {
  windowMs: TimeWindow.ONE_HOUR,
  max: 10,
  message: 'Too many login attempts, please try again later.',
  logMessage: 'Auth rate limit exceeded',
};

const SPEED_LIMIT_CONFIG: SpeedLimitConfig = {
  windowMs: TimeWindow.FIFTEEN_MINUTES,
  delayAfter: 50,
  delayIncrement: 100,
  logMessage: 'Speed limit reached - adding delays',
};

function getRateLimitConfig(type: RateLimitType.API | RateLimitType.AUTH): StandardRateLimitConfig;
function getRateLimitConfig(type: RateLimitType.SPEED): SpeedLimitConfig;
function getRateLimitConfig(type: RateLimitType): BaseRateLimitConfig {
  switch (type) {
    case RateLimitType.API:
      return API_RATE_LIMIT_CONFIG;
    case RateLimitType.AUTH:
      return AUTH_RATE_LIMIT_CONFIG;
    case RateLimitType.SPEED:
      return SPEED_LIMIT_CONFIG;
    default:
      throw new Error('Unknown rate limit type');
  }
}

function createRateLimiter(type: RateLimitType.API | RateLimitType.AUTH) {
  const config = getRateLimitConfig(type);

  if (!isStandardRateLimitConfig(config)) {
    throw new Error(`Invalid configuration for rate limiter type: ${type}`);
  }

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: config.message,
    },
    handler: (req: Request, res: Response) => {
      logger.warn({
        message: config.logMessage,
        ip: req.ip,
        method: req.method,
        url: req.url,
      });

      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: config.message,
      });
    },
  });
}

function createSpeedLimiter(type: RateLimitType.SPEED) {
  const config = getRateLimitConfig(type);

  if (!isSpeedLimitConfig(config)) {
    throw new Error(`Invalid configuration for speed limiter type: ${type}`);
  }

  return slowDown({
    windowMs: config.windowMs,
    delayAfter: config.delayAfter,
    delayMs: (hits) => {
      const delay = hits * config.delayIncrement;

      if (hits === 1) {
        logger.warn({
          message: config.logMessage,
          hits: hits + config.delayAfter,
          delayMs: delay,
        });
      }
      return delay;
    },
  });
}

export {
  RateLimitType,
  TimeWindow,
  HttpStatus,
  isStandardRateLimitConfig,
  isSpeedLimitConfig,
  getRateLimitConfig,
  createRateLimiter,
  createSpeedLimiter,
};

export const apiLimiter = createRateLimiter(RateLimitType.API);
export const authLimiter = createRateLimiter(RateLimitType.AUTH);
export const speedLimiter = createSpeedLimiter(RateLimitType.SPEED);
