import { Response } from 'express';
import {
  sendSuccess,
  sendNoContent,
  sendError,
  sendBadRequest,
  ResponseHandler,
} from '../../utils/responseHandler.ts';
import { IResponseHandler } from '../../interfaces/IResponseHandler';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
}

describe('Response Handler Utilities', () => {
  let mockResponse: MockResponse;
  let responseHandler: IResponseHandler;

  beforeEach(() => {
    const res = {} as Record<string, jest.Mock>;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    mockResponse = res as unknown as MockResponse;
    responseHandler = new ResponseHandler();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('ResponseHandler class', () => {
    describe('sendSuccess', () => {
      it('should send a success response with status 200 by default', () => {
        const data = { message: 'Operation successful', items: [1, 2, 3] };

        responseHandler.sendSuccess(mockResponse as unknown as Response, data);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: 'Operation successful',
          items: [1, 2, 3],
        });
      });

      it('should send a success response with custom status code', () => {
        const data = { message: 'Resource created' };
        const statusCode = 201;

        responseHandler.sendSuccess(mockResponse as unknown as Response, data, statusCode);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: 'Resource created',
        });
      });

      it('should handle empty data object', () => {
        responseHandler.sendSuccess(mockResponse as unknown as Response, {});

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
        });
      });
    });

    describe('sendNoContent', () => {
      it('should send a 204 No Content response', () => {
        responseHandler.sendNoContent(mockResponse as unknown as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(204);
        expect(mockResponse.send).toHaveBeenCalled();
      });
    });

    describe('sendError', () => {
      it('should send an error response with status 500 by default', () => {
        const message = 'Something went wrong';
        const error = new Error('Database connection failed');

        responseHandler.sendError(mockResponse as unknown as Response, message, error);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: 'Database connection failed',
        });
        expect(console.error).toHaveBeenCalledWith(`Error: ${message}`, error);
      });

      it('should send an error response with custom status code', () => {
        const message = 'Resource not found';
        const error = new Error('Item does not exist');
        const statusCode = 404;

        responseHandler.sendError(mockResponse as unknown as Response, message, error, statusCode);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Resource not found',
          error: 'Item does not exist',
        });
      });

      it('should handle non-Error objects', () => {
        const message = 'Something went wrong';
        const error = 'Just a string error';

        responseHandler.sendError(mockResponse as unknown as Response, message, error);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: 'Unknown error',
        });
      });

      it('should handle undefined errors', () => {
        const message = 'Something went wrong';

        responseHandler.sendError(mockResponse as unknown as Response, message, undefined);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: 'Unknown error',
        });
      });
    });

    describe('sendBadRequest', () => {
      it('should send a 400 Bad Request response', () => {
        const message = 'Invalid input data';

        responseHandler.sendBadRequest(mockResponse as unknown as Response, message);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid input data',
        });
      });
    });
  });

  describe('Exported functions', () => {
    describe('sendSuccess', () => {
      it('should send a success response with status 200 by default', () => {
        const data = { message: 'Operation successful', items: [1, 2, 3] };

        sendSuccess(mockResponse as unknown as Response, data);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: 'Operation successful',
          items: [1, 2, 3],
        });
      });
    });

    describe('sendNoContent', () => {
      it('should send a 204 No Content response', () => {
        sendNoContent(mockResponse as unknown as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(204);
        expect(mockResponse.send).toHaveBeenCalled();
      });
    });

    describe('sendError', () => {
      it('should send an error response with status 500 by default', () => {
        const message = 'Something went wrong';
        const error = new Error('Database connection failed');

        sendError(mockResponse as unknown as Response, message, error);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: 'Database connection failed',
        });
      });
    });

    describe('sendBadRequest', () => {
      it('should send a 400 Bad Request response', () => {
        const message = 'Invalid input data';

        sendBadRequest(mockResponse as unknown as Response, message);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid input data',
        });
      });
    });
  });
});
