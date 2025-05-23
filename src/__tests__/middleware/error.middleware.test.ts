import { Request, Response, NextFunction } from 'express';
import {
  APIErrorHandler,
  NotFoundError,
  ValidationError,
  DatabaseError,
} from '../../middleware/error.middleware.ts';
import { logger } from '../../middleware/logger.middleware.ts';

jest.mock('../../middleware/logger.middleware.ts', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200,
    };
    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('Error Handler', () => {
    it('should call logger when error has occurred', () => {
      const mockError = new Error('Test error message');

      APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error caught by error handler',
          error: mockError.message,
        }),
      );
    });

    it('should set status code to 500 when no specific status code is set', () => {
      const mockError = new Error('Test error message');

      APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error message',
        stack: expect.any(String),
      });
    });

    it('should preserve existing status code when already set in the response', () => {
      const mockError = new Error('Not found');
      mockResponse.statusCode = 404;

      APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
        stack: expect.any(String),
      });
    });

    it('should return generic error message and hide stack trace in production environment', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = new Error('Sensitive error details');

      APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred',
        stack: undefined,
      });

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Custom Error Types', () => {
    describe('NotFoundError', () => {
      it('should create an error with the correct name and message', () => {
        const errorMessage = 'Resource not found';
        const error = new NotFoundError(errorMessage);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe(errorMessage);
      });

      it('should format NotFoundError with 404 status code and include error message', () => {
        const mockError = new NotFoundError('Resource not found');

        APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Resource not found',
          stack: expect.any(String),
        });
      });
    });

    describe('ValidationError', () => {
      it('should create an error with the correct name and message', () => {
        const errorMessage = 'Invalid input data';
        const error = new ValidationError(errorMessage);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe(errorMessage);
      });

      it('should format ValidationError with 400 status code and include validation message', () => {
        const mockError = new ValidationError('Invalid input data');

        APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid input data',
          stack: expect.any(String),
        });
      });
    });

    describe('DatabaseError', () => {
      it('should create an error with the correct name and message', () => {
        const errorMessage = 'Database connection failed';
        const error = new DatabaseError(errorMessage);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe(errorMessage);
      });

      it('should format DatabaseError with 500 status code and include database error message', () => {
        const mockError = new DatabaseError('Database connection failed');

        APIErrorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Database connection failed',
          stack: expect.any(String),
        });
      });
    });
  });
});
