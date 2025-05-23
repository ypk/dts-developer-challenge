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

export default express;
export { mockApp };
