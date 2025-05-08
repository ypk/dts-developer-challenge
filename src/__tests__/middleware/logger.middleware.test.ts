/* eslint-disable @typescript-eslint/no-unsafe-function-type */
 
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response, NextFunction } from 'express';
import { requestLogger, logger } from '../../middleware/logger.middleware.ts';

jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  return {
    format: mockFormat,
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

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

  it('should use the logger for request logging', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(logger.info).toHaveBeenCalled();
  });
});
