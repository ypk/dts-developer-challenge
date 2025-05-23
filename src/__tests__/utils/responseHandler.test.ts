import { sendSuccess, sendNoContent, sendError, sendBadRequest } from '../../utils/responseHandler';

// Mock console.error to prevent actual logging during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('responseHandler', () => {
  let res: any;

  beforeEach(() => {
    // Create a mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should send a success response with default status code 200', () => {
      const data = { message: 'Success', data: { id: 1, name: 'Test' } };

      sendSuccess(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...data,
      });
    });

    it('should send a success response with custom status code', () => {
      const data = { message: 'Created', data: { id: 1, name: 'Test' } };
      const statusCode = 201;

      sendSuccess(res, data, statusCode);

      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...data,
      });
    });

    it('should handle empty data object', () => {
      sendSuccess(res, {});

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
      });
    });
  });

  describe('sendNoContent', () => {
    it('should send a no content response with status code 204', () => {
      sendNoContent(res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('sendError', () => {
    it('should send an error response with default status code 500', () => {
      const message = 'Something went wrong';
      const error = new Error('Test error');

      sendError(res, message, error);

      expect(console.error).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: error.message,
      });
    });

    it('should send an error response with custom status code', () => {
      const message = 'Not found';
      const error = new Error('Resource not found');
      const statusCode = 404;

      sendError(res, message, error, statusCode);

      expect(console.error).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: error.message,
      });
    });

    it('should handle non-Error objects', () => {
      const message = 'Something went wrong';
      const error = 'String error'; // Not an Error object

      sendError(res, message, error);

      expect(console.error).toHaveBeenCalledWith(`Error: ${message}`, error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Unknown error',
      });
    });

    it('should handle undefined error', () => {
      const message = 'Something went wrong';

      sendError(res, message, undefined);

      expect(console.error).toHaveBeenCalledWith(`Error: ${message}`, undefined);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'Unknown error',
      });
    });
  });

  describe('sendBadRequest', () => {
    it('should send a bad request response with status code 400', () => {
      const message = 'Invalid request';

      sendBadRequest(res, message);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });
  });
});
