import { Response } from 'express';
import {
  sendSuccess,
  sendNoContent,
  sendError,
  sendBadRequest,
} from '../../utils/responseHandler.ts';

describe('responseHandler', () => {
  let mockResponse: Partial<Response>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('sendSuccess', () => {
    it('should send success response with default status code 200', () => {
      const data = { id: 1, name: 'Test User' };

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        id: 1,
        name: 'Test User',
      });
    });

    it('should send success response with custom status code', () => {
      const data = { message: 'Created successfully' };
      const customStatusCode = 201;

      sendSuccess(mockResponse as Response, data, customStatusCode);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
      });
    });

    it('should handle empty data object', () => {
      const data = {};

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
      });
    });

    it('should handle null data', () => {
      const data = null;

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
      });
    });

    it('should spread nested object properties', () => {
      const data = {
        user: { id: 1, name: 'John' },
        count: 5,
        items: ['a', 'b', 'c'],
      };

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: { id: 1, name: 'John' },
        count: 5,
        items: ['a', 'b', 'c'],
      });
    });
  });

  describe('sendNoContent', () => {
    it('should send 204 status with no content', () => {
      sendNoContent(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledWith();
    });
  });

  describe('sendError', () => {
    it('should send error response with Error instance and default status code', () => {
      const message = 'Something went wrong';
      const error = new Error('Database connection failed');

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        error: 'Database connection failed',
      });
    });

    it('should send error response with Error instance and custom status code', () => {
      const message = 'Validation failed';
      const error = new Error('Invalid input data');
      const statusCode = 422;

      sendError(mockResponse as Response, message, error, statusCode);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: 'Invalid input data',
      });
    });

    it('should handle non-Error instance and return "Unknown error"', () => {
      const message = 'Unexpected failure';
      const error = 'String error message';

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected failure',
        error: 'Unknown error',
      });
    });

    it('should handle null error', () => {
      const message = 'Null error occurred';
      const error = null;

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Null error occurred',
        error: 'Unknown error',
      });
    });

    it('should handle undefined error', () => {
      const message = 'Undefined error occurred';
      const error = undefined;

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Undefined error occurred',
        error: 'Unknown error',
      });
    });

    it('should handle object that is not an Error instance', () => {
      const message = 'Custom object error';
      const error = { code: 'CUSTOM_ERROR', details: 'Something failed' };

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom object error',
        error: 'Unknown error',
      });
    });

    it('should handle number as error', () => {
      const message = 'Numeric error';
      const error = 404;

      sendError(mockResponse as Response, message, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Numeric error',
        error: 'Unknown error',
      });
    });
  });

  describe('sendBadRequest', () => {
    it('should send 400 bad request response', () => {
      const message = 'Invalid request data';

      sendBadRequest(mockResponse as Response, message);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid request data',
      });
    });

    it('should handle empty message', () => {
      const message = '';

      sendBadRequest(mockResponse as Response, message);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '',
      });
    });
  });

  describe('Response method chaining', () => {
    it('should verify all functions return void and work with method chaining', () => {
      const data = { test: true };
      const error = new Error('Test error');

      expect(() => {
        sendSuccess(mockResponse as Response, data);
        sendNoContent(mockResponse as Response);
        sendError(mockResponse as Response, 'Test', error);
        sendBadRequest(mockResponse as Response, 'Test');
      }).not.toThrow();

      expect(mockResponse.status).toHaveReturnedWith(mockResponse);
      expect(mockResponse.json).toHaveReturnedWith(mockResponse);
      expect(mockResponse.send).toHaveReturnedWith(mockResponse);
    });
  });
});
