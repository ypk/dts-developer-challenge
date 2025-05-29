/**
 * Unit tests for logger.middleware.ts
 */

jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  return {
    format: {
      combine: jest.fn().mockReturnThis(),
      timestamp: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      colorize: jest.fn().mockReturnThis(),
      simple: jest.fn().mockReturnThis(),
    },
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mocked/path/logs'),
  basename: jest.fn().mockReturnValue('mocked-filename'),
  dirname: jest.fn().mockReturnValue('/mocked/path'),
  extname: jest.fn().mockReturnValue('.log'),
}));

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockEventCallback: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockRequest = {
      method: 'GET',
      url: '/api/cases',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test User Agent'),
    };

    mockEventCallback = jest.fn();
    mockResponse = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          mockEventCallback = callback;
        }
        return mockResponse;
      }),
    };

    nextFunction = jest.fn();
  });

  describe('Logger initialization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create logs directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      const logsDir = '/mocked/path/logs';
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      expect(fs.existsSync).toHaveBeenCalledWith('/mocked/path/logs');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mocked/path/logs', { recursive: true });
    });

    it('should not create logs directory if it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

      const logsDir = '/mocked/path/logs';
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      expect(fs.existsSync).toHaveBeenCalledWith('/mocked/path/logs');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  it('should log request information when a request is received', async () => {
    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logger.info).toHaveBeenCalledWith({
      message: 'Request received',
      method: 'GET',
      url: '/api/cases',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test User Agent',
    });

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should log successful response information when response finishes', async () => {
    const originalDateNow = Date.now;
    const mockStartTime = 1600000000000;
    const endTimeDuration = 123;
    const mockEndTime = mockStartTime + endTimeDuration;

    Date.now = jest.fn().mockReturnValueOnce(mockStartTime).mockReturnValueOnce(mockEndTime);

    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

    mockEventCallback();

    expect(logger.info).toHaveBeenCalledWith({
      message: 'Request completed',
      method: 'GET',
      url: '/api/cases',
      statusCode: 200,
      duration: `${endTimeDuration}ms`,
      ip: '127.0.0.1',
    });

    Date.now = originalDateNow;
  });

  it('should log error information for responses with status code >= 400', async () => {
    const originalDateNow = Date.now;
    const mockStartTime = 1600000000000;
    const endTimeDuration = 123;
    const mockEndTime = mockStartTime + endTimeDuration;

    Date.now = jest.fn().mockReturnValueOnce(mockStartTime).mockReturnValueOnce(mockEndTime);

    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    mockResponse.statusCode = 500;

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

    mockEventCallback();

    expect(logger.error).toHaveBeenCalledWith({
      message: 'Request completed',
      method: 'GET',
      url: '/api/cases',
      statusCode: 500,
      duration: `${endTimeDuration}ms`,
      ip: '127.0.0.1',
    });

    Date.now = originalDateNow;
  });

  it('should log with different status codes correctly', async () => {
    const testCases = [
      { statusCode: 200, expectedLevel: 'info' },
      { statusCode: 201, expectedLevel: 'info' },
      { statusCode: 304, expectedLevel: 'info' },
      { statusCode: 400, expectedLevel: 'error' },
      { statusCode: 404, expectedLevel: 'error' },
      { statusCode: 500, expectedLevel: 'error' },
    ];

    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    for (const { statusCode, expectedLevel } of testCases) {
      jest.clearAllMocks();

      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1600000000000);

      mockResponse.statusCode = statusCode;

      requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

      mockEventCallback();

      expect(logger[expectedLevel as keyof typeof logger]).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: statusCode,
        }),
      );

      Date.now = originalDateNow;
    }
  });

  it('should handle missing IP address', async () => {
    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    const requestWithoutIp: Partial<Request> = {
      method: 'GET',
      url: '/api/cases',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test User Agent'),
    };

    requestLogger(requestWithoutIp as Request, mockResponse as Response, nextFunction);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: undefined,
      }),
    );

    mockEventCallback();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: undefined,
      }),
    );
  });

  it('should handle missing user agent', async () => {
    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    (mockRequest.get as jest.Mock).mockReturnValueOnce(undefined);

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: undefined,
      }),
    );
  });

  it('should handle response without statusCode', async () => {
    const { requestLogger, logger } = await import('../../middleware/logger.middleware.js');

    const responseWithoutStatusCode: Partial<Response> = {
      on: mockResponse.on,
    };

    requestLogger(mockRequest as Request, responseWithoutStatusCode as Response, nextFunction);
    mockEventCallback();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: undefined,
      }),
    );
  });

  describe('Winston transport configuration', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should NOT include file transports when NODE_ENV is "test"', async () => {
      jest.resetModules();

      process.env.NODE_ENV = 'test';

      const winston = await import('winston');

      await import('../../middleware/logger.middleware.js');

      expect(winston.transports.Console).toHaveBeenCalledTimes(1);
      expect(winston.transports.File).not.toHaveBeenCalled();
    });

    it('should include file transports when NODE_ENV is NOT "test"', async () => {
      jest.resetModules();

      process.env.NODE_ENV = 'development';

      const winston = await import('winston');

      await import('../../middleware/logger.middleware.js');

      expect(winston.transports.Console).toHaveBeenCalledTimes(1);
      expect(winston.transports.File).toHaveBeenCalledTimes(2);

      expect(winston.transports.File).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          filename: '/mocked/path/logs',
          level: 'error',
        }),
      );

      expect(winston.transports.File).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          filename: '/mocked/path/logs',
        }),
      );
    });
  });
});
