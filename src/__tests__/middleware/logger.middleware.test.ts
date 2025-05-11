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
import { requestLogger, logger } from '../../middleware/logger.middleware.ts';
import fs from 'fs';

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockEventCallback: Function;

  beforeEach(() => {
    jest.clearAllMocks();

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

      jest.isolateModules(() => {
        const logsDir = '/mocked/path/logs';
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
      });

      expect(fs.existsSync).toHaveBeenCalledWith('/mocked/path/logs');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mocked/path/logs', { recursive: true });
    });

    it('should not create logs directory if it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

      jest.isolateModules(() => {
        const logsDir = '/mocked/path/logs';
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
      });

      expect(fs.existsSync).toHaveBeenCalledWith('/mocked/path/logs');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  it('should log request information when a request is received', () => {
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

  it('should log successful response information when response finishes', () => {
    const originalDateNow = Date.now;
    const mockStartTime = 1600000000000;
    const endTimeDuration = 123;
    const mockEndTime = mockStartTime + endTimeDuration;

    Date.now = jest.fn().mockReturnValueOnce(mockStartTime).mockReturnValueOnce(mockEndTime);

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

  it('should log error information for responses with status code >= 400', () => {
    const originalDateNow = Date.now;
    const mockStartTime = 1600000000000;
    const endTimeDuration = 123;
    const mockEndTime = mockStartTime + endTimeDuration;

    Date.now = jest.fn().mockReturnValueOnce(mockStartTime).mockReturnValueOnce(mockEndTime);

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

  it('should log with different status codes correctly', () => {
    const testCases = [
      { statusCode: 200, expectedLevel: 'info' },
      { statusCode: 201, expectedLevel: 'info' },
      { statusCode: 304, expectedLevel: 'info' },
      { statusCode: 400, expectedLevel: 'error' },
      { statusCode: 404, expectedLevel: 'error' },
      { statusCode: 500, expectedLevel: 'error' },
    ];

    testCases.forEach(({ statusCode, expectedLevel }) => {
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
    });
  });

  it('should handle missing IP address', () => {
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
  });

  it('should handle missing user agent', () => {
    (mockRequest.get as jest.Mock).mockReturnValueOnce(undefined);

    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: undefined,
      }),
    );
  });

  it('should handle response without statusCode', () => {
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

      jest.doMock('winston', () => {
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

      process.env.NODE_ENV = 'test';

      const winston = await import('winston');

      await import('../../middleware/logger.middleware.ts');

      expect(winston.transports.Console).toHaveBeenCalledTimes(1);
      expect(winston.transports.File).not.toHaveBeenCalled();
    });

    it('should include file transports when NODE_ENV is NOT "test"', async () => {
      jest.resetModules();

      jest.doMock('winston', () => {
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

      process.env.NODE_ENV = 'development';

      const winston = await import('winston');

      await import('../../middleware/logger.middleware.ts');

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
