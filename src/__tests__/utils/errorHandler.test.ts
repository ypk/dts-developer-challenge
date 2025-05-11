import { Response } from 'express';
import {
  ErrorHandler,
  errorHandlerInstance,
  handleError,
  formatError,
  getStatusCode,
} from '../../utils/errorHandler';
import { NotFoundError } from '../../middleware/error.middleware.ts';

describe('ErrorHandler', () => {
  let mockResponse: Partial<Response>;
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    errorHandler = new ErrorHandler();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should send formatted error response with default status code', () => {
      const message = 'An error occurred';
      const error = new Error('Test error');

      errorHandler.handleError(mockResponse as Response, message, error);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Test error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, 'Test error');
    });

    it('should send formatted error response with provided status code', () => {
      const message = 'Bad request';
      const error = new Error('Invalid input');
      const statusCode = 400;

      errorHandler.handleError(mockResponse as Response, message, error, statusCode);

      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Invalid input',
      });
    });

    it('should handle string errors', () => {
      const message = 'Configuration error';
      const error = 'Missing configuration';

      errorHandler.handleError(mockResponse as Response, message, error);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Unknown error',
      });
    });

    it('should determine status code from error type if not provided', () => {
      const message = 'Case not found';
      const error = new NotFoundError('Case with ID 123 not found');

      errorHandler.handleError(mockResponse as Response, message, error);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('formatError', () => {
    it('should return error message for Error objects', () => {
      const error = new Error('Test error message');

      const result = errorHandler.formatError(error);

      expect(result).toBe('Test error message');
    });

    it('should return "Unknown error" for non-Error objects', () => {
      const result1 = errorHandler.formatError('string error');
      const result2 = errorHandler.formatError(null);
      const result3 = errorHandler.formatError(undefined);
      const result4 = errorHandler.formatError({ custom: 'error object' });

      expect(result1).toBe('Unknown error');
      expect(result2).toBe('Unknown error');
      expect(result3).toBe('Unknown error');
      expect(result4).toBe('Unknown error');
    });
  });

  describe('getStatusCode', () => {
    it('should return 404 for NotFoundError', () => {
      const error = new NotFoundError('Resource not found');

      const statusCode = errorHandler.getStatusCode(error);

      expect(statusCode).toBe(404);
    });

    it('should return 500 for generic errors', () => {
      const error1 = new Error('Generic error');
      const error2 = 'String error';
      const error3 = { message: 'Object error' };

      expect(errorHandler.getStatusCode(error1)).toBe(500);
      expect(errorHandler.getStatusCode(error2)).toBe(500);
      expect(errorHandler.getStatusCode(error3)).toBe(500);
    });
  });

  describe('Singleton instance and backward compatibility functions', () => {
    it('should export a singleton instance', () => {
      expect(errorHandlerInstance).toBeInstanceOf(ErrorHandler);
    });

    it('should provide backward compatible handleError function', () => {
      const message = 'Backward compatible error';
      const error = new Error('Legacy error');
      const statusCode = 403;

      handleError(mockResponse as Response, message, error, statusCode);

      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Legacy error',
      });
    });

    it('should provide backward compatible formatError function', () => {
      const error = new Error('Format me');

      const result = formatError(error);

      expect(result).toBe('Format me');
    });

    it('should provide backward compatible getStatusCode function', () => {
      const error = new NotFoundError('Find my status code');

      const result = getStatusCode(error);

      expect(result).toBe(404);
    });
  });
});
