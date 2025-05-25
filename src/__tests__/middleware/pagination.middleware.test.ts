/**
 * Unit tests for pagination.middleware.ts
 * @module tests/middleware/pagination
 */

import { Request, Response } from 'express';
import {
  paginationMiddleware,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  PaginationOptions,
} from '../../middleware/pagination.middleware.ts';

declare module 'express' {
  interface Request {
    pagination: PaginationOptions;
  }
}

describe('Pagination Middleware', () => {
  type MockRequest = Partial<Request> & {
    pagination?: PaginationOptions;
  };

  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('Constants', () => {
    it('should define correct default constants', () => {
      expect(DEFAULT_PAGE).toBe(1);
      expect(DEFAULT_LIMIT).toBe(10);
      expect(MAX_LIMIT).toBe(100);
    });
  });

  describe('Middleware Functionality', () => {
    it('should use default values when query parameters are missing', () => {
      mockRequest.query = {};

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(DEFAULT_PAGE);
      expect(mockRequest.pagination!.limit).toBe(DEFAULT_LIMIT);
      expect(mockRequest.pagination!.skip).toBe(0);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should parse valid query parameters correctly', () => {
      mockRequest.query = {
        page: '2',
        limit: '20',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(2);
      expect(mockRequest.pagination!.limit).toBe(20);
      expect(mockRequest.pagination!.skip).toBe(20);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle non-numeric query parameters by using defaults', () => {
      mockRequest.query = {
        page: 'invalid',
        limit: 'invalid',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(DEFAULT_PAGE);
      expect(mockRequest.pagination!.limit).toBe(DEFAULT_LIMIT);
      expect(mockRequest.pagination!.skip).toBe(0);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle page parameter < 1 by using default page', () => {
      const query: Record<string, string> = { page: '0', limit: '10' };
      mockRequest.query = query;

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(DEFAULT_PAGE);
      expect(mockRequest.pagination!.limit).toBe(10);
      expect(mockRequest.pagination!.skip).toBe(0);

      expect(mockRequest.pagination!.page).toBe(DEFAULT_PAGE);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle negative page parameter by using default page', () => {
      mockRequest.query = {
        page: '-5',
        limit: '10',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(DEFAULT_PAGE);
      expect(mockRequest.pagination!.limit).toBe(10);
      expect(mockRequest.pagination!.skip).toBe(0);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should cap limit parameter when it exceeds MAX_LIMIT', () => {
      mockRequest.query = {
        page: '1',
        limit: '200',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(1);
      expect(mockRequest.pagination!.limit).toBe(MAX_LIMIT);
      expect(mockRequest.pagination!.skip).toBe(0);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle limit parameter < 1 by using default limit', () => {
      mockRequest.query = {
        page: '2',
        limit: '0',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(2);
      expect(mockRequest.pagination!.limit).toBe(DEFAULT_LIMIT);
      expect(mockRequest.pagination!.skip).toBe(10);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle negative limit parameter by using default limit', () => {
      mockRequest.query = {
        page: '2',
        limit: '-5',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.pagination).toBeDefined();
      expect(mockRequest.pagination!.page).toBe(2);
      expect(mockRequest.pagination!.limit).toBe(DEFAULT_LIMIT);
      expect(mockRequest.pagination!.skip).toBe(10);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should calculate skip value correctly for various page and limit combinations', () => {
      const testCases = [
        { page: '1', limit: '10', expectedSkip: 0 },
        { page: '2', limit: '10', expectedSkip: 10 },
        { page: '3', limit: '5', expectedSkip: 10 },
        { page: '10', limit: '20', expectedSkip: 180 },
      ];

      testCases.forEach((testCase) => {
        mockRequest.query = {
          page: testCase.page,
          limit: testCase.limit,
        };

        paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.pagination).toBeDefined();
        expect(mockRequest.pagination!.skip).toBe(testCase.expectedSkip);
      });
    });

    it('should correctly expose the pagination interface on the request object', () => {
      mockRequest.query = {
        page: '3',
        limit: '15',
      };

      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const pagination = mockRequest.pagination!;
      expect(pagination).toEqual({
        page: 3,
        limit: 15,
        skip: 30,
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next function to continue middleware chain', () => {
      paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls.length).toBe(1);
    });
  });
});
