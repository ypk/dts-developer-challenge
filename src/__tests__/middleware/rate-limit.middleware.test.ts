/**
 * Unit tests for rate-limit.middleware.ts
 * @module tests/middleware/rate-limit
 */

import { Request, Response } from 'express';
import {
  HttpStatus,
  TimeWindow,
  RateLimitType,
  apiRequestStore,
  authRequestStore,
  speedRequestStore,
  getClientIp,
  apiLimiter,
  authLimiter,
  speedLimiter,
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
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    apiRequestStore.clear();
    authRequestStore.clear();
    speedRequestStore.clear();

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

    mockNext = jest.fn();

    jest.useRealTimers();
  });

  describe('Enums', () => {
    it('should define correct HttpStatus values', () => {
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
    });

    it('should define correct TimeWindow values', () => {
      expect(TimeWindow.FIFTEEN_MINUTES).toBe(15 * 60 * 1000);
      expect(TimeWindow.ONE_HOUR).toBe(60 * 60 * 1000);
    });

    it('should define correct RateLimitType values', () => {
      expect(RateLimitType.API).toBe(0);
      expect(RateLimitType.AUTH).toBe(1);
      expect(RateLimitType.SPEED).toBe(2);
    });
  });

  describe('Helper Functions', () => {
    it('getClientIp should return the request IP', () => {
      const ip = getClientIp(mockRequest as Request);
      expect(ip).toBe('127.0.0.1');
    });

    it('getClientIp should return "unknown" if IP is not available', () => {
      const requestWithoutIp = { ...mockRequest, ip: undefined };
      const ip = getClientIp(requestWithoutIp as Request);
      expect(ip).toBe('unknown');
    });
  });

  describe('API Rate Limiter', () => {
    it('should allow requests within the rate limit', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should block requests over the rate limit', () => {
      const now = Date.now();
      const ip = getClientIp(mockRequest as Request);
      apiRequestStore.set(ip, {
        count: 100,
        resetTime: now + TimeWindow.FIFTEEN_MINUTES,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests, please try again later.',
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should increment the counter for each request', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      const ip = getClientIp(mockRequest as Request);
      let entry = apiRequestStore.get(ip);
      expect(entry?.count).toBe(1);

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      entry = apiRequestStore.get(ip);
      expect(entry?.count).toBe(2);
    });

    it('should create a new entry if none exists', () => {
      const ip = getClientIp(mockRequest as Request);
      expect(apiRequestStore.has(ip)).toBe(false);

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(apiRequestStore.has(ip)).toBe(true);
    });

    it('should create a new entry if the existing one is expired', () => {
      const ip = getClientIp(mockRequest as Request);
      const pastTime = Date.now() - 1000;

      apiRequestStore.set(ip, {
        count: 50,
        resetTime: pastTime,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      const entry = apiRequestStore.get(ip);
      expect(entry?.count).toBe(1);
      expect(entry?.resetTime).toBeGreaterThan(pastTime);
    });

    it('should clean up expired entries', () => {
      const now = Date.now();

      apiRequestStore.set('expired1', {
        count: 1,
        resetTime: now - 1000,
      });

      apiRequestStore.set('expired2', {
        count: 1,
        resetTime: now - 2000,
      });

      apiRequestStore.set('valid', {
        count: 1,
        resetTime: now + 10000,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(apiRequestStore.has('expired1')).toBe(false);
      expect(apiRequestStore.has('expired2')).toBe(false);

      expect(apiRequestStore.has('valid')).toBe(true);
    });
  });

  describe('Auth Rate Limiter', () => {
    it('should allow requests within the rate limit', () => {
      authLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should block requests over the rate limit', () => {
      const now = Date.now();
      const ip = getClientIp(mockRequest as Request);
      authRequestStore.set(ip, {
        count: 10,
        resetTime: now + TimeWindow.ONE_HOUR,
      });

      authLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many login attempts, please try again later.',
      });
    });
  });

  describe('Speed Limiter', () => {
    let setTimeoutSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers();
      setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      jest.useRealTimers();
      setTimeoutSpy.mockRestore();
    });

    it('should allow requests under the threshold without delay', () => {
      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should start adding delays after threshold is reached', () => {
      const ip = getClientIp(mockRequest as Request);

      speedRequestStore.set(ip, {
        count: 50,
        resetTime: Date.now() + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Speed limit reached - adding delays',
          hits: 51,
          delayMs: 100,
        }),
      );

      jest.runAllTimers();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should increase delay for each request over threshold', () => {
      const ip = getClientIp(mockRequest as Request);

      speedRequestStore.set(ip, {
        count: 52,
        resetTime: Date.now() + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);

      const entry = speedRequestStore.get(ip);
      expect(entry?.count).toBe(53);
    });

    it('should log warning only once when threshold is crossed', () => {
      const ip = getClientIp(mockRequest as Request);

      speedRequestStore.set(ip, {
        count: 50,
        resetTime: Date.now() + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(logger.warn).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      mockNext.mockClear();

      speedRequestStore.set(ip, {
        count: 51,
        resetTime: Date.now() + TimeWindow.FIFTEEN_MINUTES,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should reset counts when reset time is passed', () => {
      const ip = getClientIp(mockRequest as Request);
      const pastTime = Date.now() - 1000;

      speedRequestStore.set(ip, {
        count: 100,
        resetTime: pastTime,
      });

      speedLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(setTimeoutSpy).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();

      const entry = speedRequestStore.get(ip);
      expect(entry?.count).toBe(1);
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('should handle requests from different IPs separately', () => {
      const mockRequest1 = { ...mockRequest, ip: '192.168.1.1' };
      apiLimiter(mockRequest1 as Request, mockResponse as Response, mockNext);

      const mockRequest2 = { ...mockRequest, ip: '192.168.1.2' };
      apiLimiter(mockRequest2 as Request, mockResponse as Response, mockNext);

      expect(apiRequestStore.get('192.168.1.1')?.count).toBe(1);
      expect(apiRequestStore.get('192.168.1.2')?.count).toBe(1);
    });
    it('should keep separate counts for different limiters', () => {
      const ip = '127.0.0.1';
      const mockRequestWithIp = { ...mockRequest, ip };

      apiLimiter(mockRequestWithIp as Request, mockResponse as Response, mockNext);
      authLimiter(mockRequestWithIp as Request, mockResponse as Response, mockNext);
      speedLimiter(mockRequestWithIp as Request, mockResponse as Response, mockNext);

      expect(apiRequestStore.get(ip)?.count).toBe(1);
      expect(authRequestStore.get(ip)?.count).toBe(1);
      expect(speedRequestStore.get(ip)?.count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with multiple calls to the same limiter', () => {
      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      const ip = getClientIp(mockRequest as Request);
      expect(apiRequestStore.get(ip)?.count).toBe(3);
    });

    it('should use correct error messages for each limiter', () => {
      const ip = getClientIp(mockRequest as Request);

      apiRequestStore.set(ip, {
        count: 100,
        resetTime: Date.now() + TimeWindow.FIFTEEN_MINUTES,
      });

      apiLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests, please try again later.',
      });

      jest.clearAllMocks();

      authRequestStore.set(ip, {
        count: 10,
        resetTime: Date.now() + TimeWindow.ONE_HOUR,
      });

      authLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many login attempts, please try again later.',
      });
    });
  });
});
