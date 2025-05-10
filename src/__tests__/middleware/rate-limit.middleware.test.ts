import { Request, Response, NextFunction } from 'express';
import {
  apiLimiter,
  authLimiter,
  speedLimiter,
  getClientIp,
  apiRequestStore,
  authRequestStore,
  speedRequestStore,
  RateLimitType,
  TimeWindow,
  HttpStatus,
} from '../../middleware/rate-limit.middleware.ts';
import { logger } from '../../middleware/logger.middleware.ts';

jest.mock('../../middleware/logger.middleware.ts', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    apiRequestStore.clear();
    authRequestStore.clear();
    speedRequestStore.clear();

    jest.clearAllMocks();

    mockRequest = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('getClientIp', () => {
    it('should return the IP address from the request', () => {
      const ip = getClientIp(mockRequest as Request);
      expect(ip).toBe('127.0.0.1');
    });

    it('should return "unknown" if IP is not available', () => {
      const requestWithoutIp: Partial<Request> = {
        method: 'GET',
        url: '/api/test',
      };
      const ip = getClientIp(requestWithoutIp as Request);
      expect(ip).toBe('unknown');
    });
  });

  describe('apiLimiter', () => {
    it('should allow requests under the limit', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should block requests over the limit', () => {
      const ip = mockRequest.ip as string;
      const now = Date.now();
      apiRequestStore.set(ip, {
        count: 100,
        resetTime: now + TimeWindow.FIFTEEN_MINUTES,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests, please try again later.',
      });

      expect(nextFunction).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Rate limit exceeded',
        ip: mockRequest.ip,
        method: mockRequest.method,
        url: mockRequest.url,
      });
    });

    it('should clean up expired entries', () => {
      const expiredIp = '192.168.1.1';
      apiRequestStore.set(expiredIp, {
        count: 50,
        resetTime: Date.now() - 1000,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(apiRequestStore.has(expiredIp)).toBe(false);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should increment the request count for an IP', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      const entry = apiRequestStore.get(mockRequest.ip as string);

      expect(entry?.count).toBe(1);
    });

    it('should set correct remaining count for multiple requests', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');

      jest.clearAllMocks();

      apiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '98');
    });
  });

  describe('authLimiter', () => {
    it('should allow requests under the limit', () => {
      authLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should block requests over the limit', () => {
      const ip = mockRequest.ip as string;
      const now = Date.now();
      authRequestStore.set(ip, {
        count: 10,
        resetTime: now + TimeWindow.ONE_HOUR,
      });

      authLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many login attempts, please try again later.',
      });

      expect(nextFunction).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Auth rate limit exceeded',
        ip: mockRequest.ip,
        method: mockRequest.method,
        url: mockRequest.url,
      });
    });

    it('should clean up expired entries', () => {
      const expiredIp = '192.168.1.1';
      authRequestStore.set(expiredIp, {
        count: 5,
        resetTime: Date.now() - 1000,
      });

      authLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(authRequestStore.has(expiredIp)).toBe(false);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('speedLimiter', () => {
    it('should not delay requests under the threshold', () => {
      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should delay requests over the threshold', () => {
      jest.useFakeTimers();

      const ip = mockRequest.ip as string;
      const now = Date.now();
      speedRequestStore.set(ip, {
        count: 50,
        resetTime: now + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Speed limit reached - adding delays',
        ip: mockRequest.ip,
        method: mockRequest.method,
        url: mockRequest.url,
        hits: 51,
        delayMs: 100,
      });

      jest.advanceTimersByTime(100);

      expect(nextFunction).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not log warnings for subsequent requests over threshold', () => {
      jest.useFakeTimers();

      const ip = mockRequest.ip as string;
      const now = Date.now();
      speedRequestStore.set(ip, {
        count: 52,
        resetTime: now + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.warn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(nextFunction).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should increase delay as request count increases', () => {
      jest.useFakeTimers();

      const ip = mockRequest.ip as string;
      const now = Date.now();
      speedRequestStore.set(ip, {
        count: 51,
        resetTime: now + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      jest.advanceTimersByTime(200);

      expect(nextFunction).toHaveBeenCalled();

      jest.clearAllMocks();

      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(nextFunction).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should clean up expired entries', () => {
      const expiredIp = '192.168.1.1';
      speedRequestStore.set(expiredIp, {
        count: 60,
        resetTime: Date.now() - 1000,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(speedRequestStore.has(expiredIp)).toBe(false);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Enum values', () => {
    it('should have correct RateLimitType values', () => {
      expect(RateLimitType.API).toBe(0);
      expect(RateLimitType.AUTH).toBe(1);
      expect(RateLimitType.SPEED).toBe(2);
    });

    it('should have correct TimeWindow values', () => {
      expect(TimeWindow.FIFTEEN_MINUTES).toBe(15 * 60 * 1000);
      expect(TimeWindow.ONE_HOUR).toBe(60 * 60 * 1000);
    });

    it('should have correct HttpStatus values', () => {
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
    });
  });
});
