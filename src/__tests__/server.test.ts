/* eslint-disable no-console */
 
 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn(),
};

const jsonMiddleware = jest.fn();

type MockExpressFn = {
  (): typeof mockApp;
  json: jest.Mock;
};

const mockExpress = jest.fn(() => mockApp) as unknown as MockExpressFn;

mockExpress.json = jest.fn(() => jsonMiddleware);

const mockDotenv = {
  config: jest.fn(),
};

jest.mock('express', () => mockExpress);
jest.mock('dotenv', () => mockDotenv);
jest.mock('../routes/index.ts', () => 'mock-routes');
jest.mock('../utils/swagger.ts', () => ({ setupSwagger: jest.fn() }));

describe('Server Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Server Setup', () => {
    it('should set up the server correctly', async () => {
      await import('../server.ts');
      expect(mockExpress).toHaveBeenCalled();
      expect(mockDotenv.config).toHaveBeenCalled();
      expect(mockExpress.json).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith(jsonMiddleware);

      const { setupSwagger } = await import('../utils/swagger.ts');
      expect(setupSwagger).toHaveBeenCalledWith(mockApp);

      const apiRouteCall = mockApp.use.mock.calls.find((call) => call[0] === '/api');
      expect(apiRouteCall).toBeDefined();

      if (!apiRouteCall) {
        throw new Error('API route not found');
      }

      expect(apiRouteCall[0]).toBe('/api');
      expect(apiRouteCall[1]).toBeDefined();
      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));

      const healthCheckCall = mockApp.get.mock.calls.find((call) => call[0] === '/health');

      if (!healthCheckCall) {
        throw new Error('Health check endpoint not found');
      }

      const healthCheckHandler = healthCheckCall[1] as (
        req: any,
        res: { status: (code: number) => any; json: (data: any) => void },
      ) => void;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      healthCheckHandler({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('Server Startup', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalPort = process.env.PORT;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.PORT = originalPort;
    });

    it('should not start server when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';

      await import('../server.ts');

      expect(mockApp.listen).not.toHaveBeenCalled();
    });

    it('should start server with default port when NODE_ENV is not test', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      process.env.NODE_ENV = 'development';
      delete process.env.PORT;

      await import('../server.ts');

      expect(mockApp.listen).toHaveBeenCalled();
      expect(mockApp.listen.mock.calls[0][0]).toBe(3000);
      expect(typeof mockApp.listen.mock.calls[0][1]).toBe('function');

      console.log = originalConsoleLog;
    });

    it('should start server with specified port when PORT env var is set', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      process.env.NODE_ENV = 'development';
      process.env.PORT = '4000';

      await import('../server.ts');

      expect(mockApp.listen).toHaveBeenCalled();
      expect(mockApp.listen.mock.calls[0][0]).toBe('4000');
      expect(typeof mockApp.listen.mock.calls[0][1]).toBe('function');

      console.log = originalConsoleLog;
    });

    it('should log server startup message', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';

      await import('../server.ts');

      const listenCallback = mockApp.listen.mock.calls[0][1] as () => void;

      listenCallback();

      expect(console.log).toHaveBeenCalledWith('Server is running on port 3000');
      expect(console.log).toHaveBeenCalledWith(
        'API Documentation available at http://localhost:3000/api-docs',
      );

      console.log = originalConsoleLog;
    });
  });
});
