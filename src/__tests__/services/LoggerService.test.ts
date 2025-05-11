import winston from 'winston';
import { LoggerService } from '../../services/LoggerService.ts';

// Clear any previous mocks
jest.clearAllMocks();

// Setup winston mock
jest.mock('winston', () => {
  // Create a proper mock logger that includes all needed methods
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
    add: jest.fn(), // This is the method that's failing in your test
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    format: {
      combine: jest.fn().mockReturnThis(),
      timestamp: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      colorize: jest.fn().mockReturnThis(),
      simple: jest.fn().mockReturnThis(),
    },
    transports: {
      File: jest.fn().mockImplementation(() => ({})),
      Console: jest.fn().mockImplementation(() => ({})),
    },
  };
});

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let mockWinstonLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset NODE_ENV to 'test' to ensure tests run consistently
    process.env.NODE_ENV = 'test';

    // Ensure createLogger returns a consistent mock
    mockWinstonLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
      add: jest.fn(),
    };

    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

    // Now create logger service after mocks are properly set up
    loggerService = new LoggerService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create a winston logger with default options', () => {
      expect(winston.createLogger).toHaveBeenCalled();
      const options = (winston.createLogger as jest.Mock).mock.calls[0][0];

      expect(options.level).toBe(process.env.LOG_LEVEL || 'info');
      expect(options.defaultMeta.service).toBe('case-management-api');
      expect(winston.transports.File).toHaveBeenCalledTimes(2);
    });

    it('should add console transport in non-production environment', () => {
      // Reset the service with development environment
      process.env.NODE_ENV = 'development';

      // Create a new service to trigger the constructor again
      new LoggerService();

      expect(mockWinstonLogger.add).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
    });

    it('should not add console transport in production environment', () => {
      // Reset the service with production environment
      process.env.NODE_ENV = 'production';
      mockWinstonLogger.add.mockClear();

      // Create a new service to trigger the constructor again
      new LoggerService();

      expect(mockWinstonLogger.add).not.toHaveBeenCalled();
    });

    it('should accept custom options', () => {
      const customOptions = {
        level: 'debug',
        defaultMeta: { service: 'test-service' },
        transports: [],
      };

      new LoggerService(customOptions);

      expect(winston.createLogger).toHaveBeenCalledWith(customOptions);
    });
  });

  describe('logging methods', () => {
    it('should call winston info method', () => {
      const message = 'Test info message';
      const meta = { test: 'data' };

      loggerService.info(message, meta);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should call winston warn method', () => {
      const message = 'Test warning message';
      const meta = { test: 'data' };

      loggerService.warn(message, meta);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('should call winston error method with formatted error', () => {
      const message = 'Test error message';
      const error = new Error('Test error');
      const meta = { test: 'data' };

      loggerService.error(message, error, meta);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        error: error.message,
        stack: error.stack,
        ...meta,
      });
    });

    it('should call winston error method with string error', () => {
      const message = 'Test error message';
      const error = 'String error';
      const meta = { test: 'data' };

      loggerService.error(message, error, meta);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        error: 'String error',
        stack: undefined,
        ...meta,
      });
    });

    it('should call winston debug method', () => {
      const message = 'Test debug message';
      const meta = { test: 'data' };

      loggerService.debug(message, meta);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, meta);
    });
  });

  describe('child method', () => {
    it('should create a child logger with added context', () => {
      const context = { requestId: '123' };
      mockWinstonLogger.child.mockReturnValueOnce({
        // Return a new mock logger for the child
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        add: jest.fn(),
      });

      const childLogger = loggerService.child(context);

      expect(mockWinstonLogger.child).toHaveBeenCalledWith(context);
      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(LoggerService);
    });
  });
});
