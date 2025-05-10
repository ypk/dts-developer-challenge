import { Request, Response, NextFunction } from 'express';
import {
  paginationMiddleware,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../../middleware/pagination.middleware.ts';

describe('Pagination Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should set default pagination values when no query parameters are provided', () => {
    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toBeDefined();
    expect(mockRequest.pagination).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      skip: 0,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use provided page and limit values', () => {
    mockRequest.query = {
      page: '2',
      limit: '20',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: 2,
      limit: 20,
      skip: 20,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle non-numeric values and use defaults', () => {
    mockRequest.query = {
      page: 'abc',
      limit: 'xyz',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      skip: 0,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should enforce minimum page value of 1', () => {
    mockRequest.query = {
      page: '-1',
      limit: '10',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: DEFAULT_PAGE,
      limit: 10,
      skip: 0,
    });
    expect(mockRequest.query.page).toBe(DEFAULT_PAGE.toString());
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should enforce minimum limit value of 1', () => {
    mockRequest.query = {
      page: '1',
      limit: '0',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: 1,
      limit: DEFAULT_LIMIT,
      skip: 0,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set limit to DEFAULT_LIMIT when limit is negative', () => {
    mockRequest.query = {
      page: '2',
      limit: '-5',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: 2,
      limit: DEFAULT_LIMIT,
      skip: DEFAULT_LIMIT,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should enforce maximum limit value', () => {
    mockRequest.query = {
      page: '1',
      limit: '500',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: 1,
      limit: MAX_LIMIT,
      skip: 0,
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should calculate skip value correctly', () => {
    mockRequest.query = {
      page: '3',
      limit: '15',
    };

    paginationMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual({
      page: 3,
      limit: 15,
      skip: 30,
    });
    expect(nextFunction).toHaveBeenCalled();
  });
});
