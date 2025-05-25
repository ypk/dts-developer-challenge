/**
 * Unit tests for error.middleware.ts
 */

import {
  NotFoundError,
  ValidationError,
  DatabaseError,
  isPrismaNotFoundError,
  isPrismaUniqueViolationError,
  APIErrorHandler,
  FrontEndErrorHandler,
} from '../../middleware/error.middleware.ts';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../middleware/logger.middleware.ts';

jest.mock('../../middleware/logger.middleware.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Custom Error Classes', () => {
    it('should create NotFoundError with correct name and message', () => {
      const errorMessage = 'Resource not found';
      const error = new NotFoundError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(errorMessage);
    });

    it('should create ValidationError with correct name and message', () => {
      const errorMessage = 'Validation failed';
      const error = new ValidationError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(errorMessage);
    });

    it('should create DatabaseError with correct name and message', () => {
      const errorMessage = 'Database operation failed';
      const error = new DatabaseError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe(errorMessage);
    });
  });

  describe('isPrismaNotFoundError function', () => {
    it('should return true for Prisma not found error (P2025)', () => {
      const prismaError = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });

      expect(isPrismaNotFoundError(prismaError)).toBe(true);
    });

    it('should return false for other Prisma errors', () => {
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
      });

      expect(isPrismaNotFoundError(prismaError)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('Generic error');
      expect(isPrismaNotFoundError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isPrismaNotFoundError(null)).toBe(false);
      expect(isPrismaNotFoundError(undefined)).toBe(false);
    });
  });

  describe('isPrismaUniqueViolationError function', () => {
    it('should return true for Prisma unique constraint violation (P2002)', () => {
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
      });

      expect(isPrismaUniqueViolationError(prismaError)).toBe(true);
    });

    it('should return false for other Prisma errors', () => {
      const prismaError = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });

      expect(isPrismaUniqueViolationError(prismaError)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('Generic error');
      expect(isPrismaUniqueViolationError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isPrismaUniqueViolationError(null)).toBe(false);
      expect(isPrismaUniqueViolationError(undefined)).toBe(false);
    });
  });

  describe('APIErrorHandler middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        url: '/api/test',
        method: 'GET',
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        statusCode: 200,
      };

      mockNext = jest.fn();
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
        }),
      );
    });

    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Validation failed');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
        }),
      );
    });

    it('should handle DatabaseError with 500 status', () => {
      const error = new DatabaseError('Database operation failed');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
        }),
      );
    });

    it('should use existing non-200 status code if present', () => {
      mockResponse.statusCode = 418; // I'm a teapot
      const error = new Error('Generic error');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
        }),
      );
    });

    it('should use 500 status for generic errors', () => {
      const error = new Error('Generic error');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
        }),
      );
    });

    it('should hide detailed error messages in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Detailed error message');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'An error occurred',
          stack: undefined,
        }),
      );
    });

    it('should include stack trace in non-production environments', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Detailed error message');

      APIErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: error.message,
          stack: error.stack,
        }),
      );
    });
  });

  describe('FrontEndErrorHandler middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {};

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      mockNext = jest.fn();
    });

    it('should pass API route errors to next middleware', () => {
      const apiRequest = { path: '/api/test' } as Partial<Request>;
      const error = new Error('API error');

      FrontEndErrorHandler(error, apiRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.render).not.toHaveBeenCalled();
    });

    it('should render error page for non-API routes', () => {
      const webRequest = { path: '/dashboard' } as Partial<Request>;
      const error = new Error('Frontend error');

      FrontEndErrorHandler(error, webRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.render).toHaveBeenCalledWith(
        'pages/error',
        expect.objectContaining({
          title: 'Error',
          pageHeading: 'An error occurred',
          errorMessage: error.message,
        }),
      );
    });

    it('should use error status code if available', () => {
      const webRequest = { path: '/dashboard' } as Partial<Request>;
      const error: any = new Error('Frontend error with status');
      error.status = 404;

      FrontEndErrorHandler(error, webRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should use default error message if none provided', () => {
      const webRequest = { path: '/dashboard' } as Partial<Request>;
      const error: any = new Error();
      error.message = '';

      FrontEndErrorHandler(error, webRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.render).toHaveBeenCalledWith(
        'pages/error',
        expect.objectContaining({
          errorMessage: 'An unexpected error occurred',
        }),
      );
    });

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const webRequest = { path: '/dashboard' } as Partial<Request>;
      const error = new Error('Frontend error');
      error.stack = 'Error stack trace';

      FrontEndErrorHandler(error, webRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.render).toHaveBeenCalledWith(
        'pages/error',
        expect.objectContaining({
          errorStack: error.stack,
        }),
      );
    });

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production';
      const webRequest = { path: '/dashboard' } as Partial<Request>;
      const error = new Error('Frontend error');
      error.stack = 'Error stack trace';

      FrontEndErrorHandler(error, webRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.render).toHaveBeenCalledWith(
        'pages/error',
        expect.objectContaining({
          errorStack: '',
        }),
      );
    });
  });
});
