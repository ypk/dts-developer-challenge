import { Request, Response } from 'express';

/**
 * Mocks the Express application for testing purposes.
 * Provides a mock implementation of Express with configurable middleware and route handling.
 *
 * @returns A mocked Express application with stubbed methods for testing
 */
interface Express {
  (): any;
  json: jest.Mock;
  urlencoded: jest.Mock;
  static: jest.Mock;
}

const mockApp = {
  use: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  get: jest.fn().mockImplementation((path, handler) => {
    if (path === '/health' && typeof handler === 'function') {
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      handler(mockReq, mockRes);
    }
    return mockApp;
  }),
  listen: jest.fn().mockImplementation((port, cb) => {
    if (cb) cb();
    return { on: jest.fn() };
  }),
};

const express = jest.fn(() => mockApp) as unknown as Express;

express.json = jest.fn(() => 'mocked-json-middleware');
express.urlencoded = jest.fn(() => 'mocked-urlencoded-middleware');
express.static = jest.fn(() => 'mocked-static-middleware');

const mockNext = jest.fn();

const mockValidationResult = jest.fn(() => ({
  isEmpty: jest.fn(),
  array: jest.fn(),
}));

const mockRequest = {
  session: {
    regenerate: jest.fn(),
    destroy: jest.fn(),
    reload: jest.fn(),
    save: jest.fn(),
    touch: jest.fn(),
    resetMaxAge: jest.fn(),
  },
  body: {},
  params: {},
  path: '',
  flash: jest.fn(),
  header: jest.fn(),
  accepts: jest.fn(),
  query: {},
  cookies: {},
  method: 'GET',
  protocol: 'http',
  secure: false,
  ip: '127.0.0.1',
  ips: ['127.0.0.1'],
  originalUrl: '',
  pagination: {},
  cache: jest.fn(),
  credentials: jest.fn(),
  destination: jest.fn(),
  ...mockApp,
} as unknown as Request;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  flash: jest.fn(),
  headers: {},
  ok: true,
  redirected: false,
  statusText: '',
  type: '',
  url: '',
  clone: jest.fn(),
  body: null,
  send: jest.fn(),
  end: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  location: jest.fn(),
  render: jest.fn(),
} as unknown as Response;

export default express;
export { mockApp, mockRequest, mockResponse, mockNext, mockValidationResult };
