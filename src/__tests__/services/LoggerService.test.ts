import { LoggerService } from '../../services/LoggerService.ts';
import winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
    add: jest.fn(),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    format: {
      timestamp: jest.fn().mockReturnValue('timestamp-format'),
      json: jest.fn().mockReturnValue('json-format'),
      combine: jest.fn().mockReturnValue('combined-format'),
      colorize: jest.fn().mockReturnValue('colorize-format'),
      simple: jest.fn().mockReturnValue('simple-format'),
    },
    transports: {
      File: jest.fn(),
      Console: jest.fn(),
    },
  };
});

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let mockWinstonLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerService = new LoggerService();
    mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
  });

  it('should create a logger with default options', () => {
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalledTimes(2);
  });

  it('should add console transport in non-production environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    new LoggerService();

    expect(mockWinstonLogger.add).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages', () => {
    const message = 'Info message';
    const meta = { user: 'test' };

    loggerService.info(message, meta);

    expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, meta);
  });

  it('should log warning messages', () => {
    const message = 'Warning message';
    const meta = { user: 'test' };

    loggerService.warn(message, meta);

    expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, meta);
  });

  it('should log error messages with Error object', () => {
    const message = 'Error message';
    const error = new Error('Test error');
    const meta = { user: 'test' };

    loggerService.error(message, error, meta);

    expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  });

  it('should log error messages with string error', () => {
    const message = 'Error message';
    const error = 'String error';
    const meta = { user: 'test' };

    loggerService.error(message, error, meta);

    expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
      error: 'String error',
      stack: undefined,
      ...meta,
    });
  });

  it('should log debug messages', () => {
    const message = 'Debug message';
    const meta = { user: 'test' };

    loggerService.debug(message, meta);

    expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, meta);
  });

  it('should create a child logger with context', () => {
    const context = { requestId: '123' };

    loggerService.child(context);

    expect(mockWinstonLogger.child).toHaveBeenCalledWith(context);
  });
});
