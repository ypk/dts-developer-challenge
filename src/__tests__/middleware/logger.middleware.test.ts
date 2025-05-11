import { Request, Response, NextFunction } from 'express';
import { container } from '../../di/container.ts';
import { TYPES } from '../../di/types.ts';
import { ILoggerService } from '../../interfaces/ILoggerService.ts';
import { requestLogger } from '../../middleware/logger.middleware.ts';

// Mock the container to return a mock logger
jest.mock('../../di/container.ts', () => ({
  container: {
    get: jest.fn(),
  },
}));

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockLogger: ILoggerService;
  let resFinishCallback: Function;

  beforeEach(() => {
    // Set up mocks
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };

    // Mock container to return our mock logger
    (container.get as jest.Mock).mockReturnValue(mockLogger);

    // Mock Express request and response
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
    };

    resFinishCallback = jest.fn();
    mockResponse = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          resFinishCallback = callback;
        }
        return mockResponse;
      }),
      statusCode: 200,
    };

    mockNext = jest.fn();

    // Reset date mocks
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve logger from container', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(container.get).toHaveBeenCalledWith(TYPES.LoggerService);
  });

  it('should log incoming request', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockLogger.info).toHaveBeenCalledWith('Incoming Request', {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
    });
  });

  it('should call next middleware', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should log successful response', () => {
    // Set up the test
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    // Mock response completion
    jest.spyOn(Date, 'now').mockImplementation(() => 1500); // 500ms later
    resFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith('HTTP 200', {
      method: 'GET',
      url: '/api/test',
      statusCode: 200,
      duration: 500,
    });
  });

  it('should log warning for 4xx responses', () => {
    // Set up the test with a 404 status
    mockResponse.statusCode = 404;
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    // Mock response completion
    jest.spyOn(Date, 'now').mockImplementation(() => 1500); // 500ms later
    resFinishCallback();

    expect(mockLogger.warn).toHaveBeenCalledWith('HTTP 404', {
      method: 'GET',
      url: '/api/test',
      statusCode: 404,
      duration: 500,
    });
  });

  it('should log warning for 5xx responses', () => {
    // Set up the test with a 500 status
    mockResponse.statusCode = 500;
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    // Mock response completion
    jest.spyOn(Date, 'now').mockImplementation(() => 1500); // 500ms later
    resFinishCallback();

    expect(mockLogger.warn).toHaveBeenCalledWith('HTTP 500', {
      method: 'GET',
      url: '/api/test',
      statusCode: 500,
      duration: 500,
    });
  });
});
