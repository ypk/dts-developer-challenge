/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/error.middleware.ts';
import { NotFoundError, ValidationError, DatabaseError } from '../../utils/errorHandler.ts';

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set status code to 500 when no specific status code is set', () => {
    const mockError = new Error('Test error message');

    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

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

    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

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

    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'An error occurred',
      stack: undefined,
    });

    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Custom Error Types', () => {
    it('should format NotFoundError with 404 status code and include error message', () => {
      const mockError = new NotFoundError('Resource not found');
      mockResponse.statusCode = 404;

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        stack: expect.any(String),
      });
    });

    it('should format ValidationError with 400 status code and include validation message', () => {
      const mockError = new ValidationError('Invalid input data');
      mockResponse.statusCode = 400;

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input data',
        stack: expect.any(String),
      });
    });

    it('should format DatabaseError with 500 status code and include database error message', () => {
      const mockError = new DatabaseError('Database connection failed');

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        stack: expect.any(String),
      });
    });
  });
});
