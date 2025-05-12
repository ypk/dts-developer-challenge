import { Request, Response } from 'express';
import { validateAndParseId, handleNotFoundError } from '../../utils/caseHelper.ts';
import { sendError, sendBadRequest } from '../../utils/responseHandler.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';

jest.mock('../../utils/responseHandler.ts', () => ({
  sendError: jest.fn(),
  sendBadRequest: jest.fn(),
}));

describe('Case Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndParseId function', () => {
    it('should return the parsed ID when valid', () => {
      const req = {
        params: {
          id: '123',
        },
      } as unknown as Request;
      const res = {} as Response;
      const result = validateAndParseId(req, res);
      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null and call sendBadRequest when ID is not a number', () => {
      const req = {
        params: {
          id: 'abc',
        },
      } as unknown as Request;
      const res = {} as Response;
      const result = validateAndParseId(req, res);
      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(res, 'Invalid case ID');
    });

    it('should return null and call sendBadRequest when ID is missing', () => {
      const req = {
        params: {},
      } as unknown as Request;
      const res = {} as Response;
      const result = validateAndParseId(req, res);
      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(res, 'Invalid case ID');
    });

    it('should return null and call sendBadRequest when ID is empty', () => {
      const req = {
        params: {
          id: '',
        },
      } as unknown as Request;
      const res = {} as Response;
      const result = validateAndParseId(req, res);
      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(res, 'Invalid case ID');
    });

    it('should return null and call sendBadRequest when ID is a decimal', () => {
      const req = {
        params: {
          id: '123.45',
        },
      } as unknown as Request;
      const res = {} as Response;
      const result = validateAndParseId(req, res);
      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });
  });

  describe('handleNotFoundError function', () => {
    it('should return true and call sendError when error is a NotFoundError', () => {
      const error = new NotFoundError('Resource not found');
      const res = {} as Response;
      const result = handleNotFoundError(error, res);

      expect(result).toBe(true);
      expect(sendError).toHaveBeenCalledWith(res, 'Resource not found', error, 404);
    });

    it('should return false and not call sendError when error is not a NotFoundError', () => {
      const error = new Error('Some other error');
      const res = {} as Response;
      const result = handleNotFoundError(error, res);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false and not call sendError when error is null', () => {
      const res = {} as Response;
      const result = handleNotFoundError(null, res);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false and not call sendError when error is undefined', () => {
      const res = {} as Response;
      const result = handleNotFoundError(undefined, res);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false and not call sendError when error is a string', () => {
      const res = {} as Response;
      const result = handleNotFoundError('error message', res);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });
  });
});
