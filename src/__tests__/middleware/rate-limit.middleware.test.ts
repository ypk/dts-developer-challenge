/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from 'express';
import { logger } from '../../middleware/logger.middleware.ts';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import {
  apiLimiter,
  authLimiter,
  speedLimiter,
  RateLimitType,
  createRateLimiter,
  createSpeedLimiter,
  getRateLimitConfig,
  isStandardRateLimitConfig,
  isSpeedLimitConfig,
} from '../../middleware/rate-limit.middleware.ts';

// Define custom types for our mocked objects
interface MockRateLimiter {
  __options: any;
  __mockRateLimiter: boolean;
  testHandler: (req: Request, res: Response) => void;
}

interface MockSpeedLimiter {
  __options: any;
  __mockSpeedLimiter: boolean;
  testDelayMs: (hits: number) => number;
}

// Mock dependencies
jest.mock('../../middleware/logger.middleware', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    const mockLimiter: Partial<MockRateLimiter> = {
      __options: options,
      __mockRateLimiter: true,
    };

    if (options.handler) {
      mockLimiter.testHandler = (req: Request, res: Response) => {
        options.handler(req, res);
      };
    }

    return mockLimiter;
  });
});

jest.mock('express-slow-down', () => {
  return jest.fn().mockImplementation((options) => {
    const mockLimiter: Partial<MockSpeedLimiter> = {
      __options: options,
      __mockSpeedLimiter: true,
    };

    if (options.delayMs) {
      mockLimiter.testDelayMs = (hits: number) => {
        return options.delayMs(hits);
      };
    }

    return mockLimiter;
  });
});

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  // Cast the exported limiters to our mock types for testing
  const mockApiLimiter = apiLimiter as unknown as MockRateLimiter;
  const mockAuthLimiter = authLimiter as unknown as MockRateLimiter;
  const mockSpeedLimiter = speedLimiter as unknown as MockSpeedLimiter;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/test',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Exported limiters', () => {
    it('should export apiLimiter', () => {
      expect(apiLimiter).toBeDefined();
      expect(mockApiLimiter.__mockRateLimiter).toBe(true);
    });

    it('should export authLimiter', () => {
      expect(authLimiter).toBeDefined();
      expect(mockAuthLimiter.__mockRateLimiter).toBe(true);
    });

    it('should export speedLimiter', () => {
      expect(speedLimiter).toBeDefined();
      expect(mockSpeedLimiter.__mockSpeedLimiter).toBe(true);
    });
  });

  describe('API Rate Limiter', () => {
    it('should be configured with correct settings', () => {
      expect(mockApiLimiter.__options).toMatchObject({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many requests, please try again later.',
        },
      });
    });

    it('should handle rate limit exceeded correctly', () => {
      // Test the handler function
      mockApiLimiter.testHandler(mockRequest as Request, mockResponse as Response);

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Rate limit exceeded',
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests, please try again later.',
      });
    });
  });

  describe('Auth Rate Limiter', () => {
    it('should be configured with correct settings', () => {
      expect(mockAuthLimiter.__options).toMatchObject({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many login attempts, please try again later.',
        },
      });
    });

    it('should handle rate limit exceeded correctly', () => {
      // Test the handler function
      mockAuthLimiter.testHandler(mockRequest as Request, mockResponse as Response);

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Auth rate limit exceeded',
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/test',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many login attempts, please try again later.',
      });
    });
  });

  describe('Speed Limiter', () => {
    it('should be configured with correct settings', () => {
      expect(mockSpeedLimiter.__options).toMatchObject({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50,
      });
    });

    it('should calculate delay correctly', () => {
      expect(mockSpeedLimiter.testDelayMs(1)).toBe(100); // 1 * 100
      expect(mockSpeedLimiter.testDelayMs(2)).toBe(200); // 2 * 100
      expect(mockSpeedLimiter.testDelayMs(5)).toBe(500); // 5 * 100
    });

    it('should log warning on first hit over threshold', () => {
      // First hit should log
      mockSpeedLimiter.testDelayMs(1);

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Speed limit reached - adding delays',
        hits: 51, // 1 + delayAfter (50)
        delayMs: 100,
      });

      // Reset mocks
      jest.clearAllMocks();

      // Subsequent hits should not log
      mockSpeedLimiter.testDelayMs(2);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
