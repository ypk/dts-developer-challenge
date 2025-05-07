/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should set up the server correctly', async () => {
    await import('../server.ts');

    expect(mockExpress).toHaveBeenCalled();

    expect(mockDotenv.config).toHaveBeenCalled();

    expect(mockExpress.json).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith(jsonMiddleware);

    const { setupSwagger } = await import('../utils/swagger.ts');
    expect(setupSwagger).toHaveBeenCalledWith(mockApp);

    const apiRouteCalls = mockApp.use.mock.calls.filter((call: any[]) => call[0] === '/api');
    expect(apiRouteCalls.length).toBeGreaterThan(0);

    expect(apiRouteCalls[0]?.[1]).toBeDefined();

    const healthCheckCalls = mockApp.get.mock.calls.filter((call: any[]) => call[0] === '/health');
    expect(healthCheckCalls.length).toBeGreaterThan(0);

    const healthCheckHandler = healthCheckCalls[0]?.[1] as
      | ((
          req: unknown,
          res: { status: (code: number) => { json: (data: unknown) => void } },
        ) => void)
      | undefined;

    if (!healthCheckHandler) {
      throw new Error('Health check endpoint not found');
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    healthCheckHandler(
      {},
      mockRes as { status: (code: number) => { json: (data: unknown) => void } },
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  describe('Server startup', () => {
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

      const listenCalls = mockApp.listen.mock.calls;
      expect(listenCalls.length).toBeGreaterThan(0);
      expect(listenCalls[0]?.[0]).toBe(3000);
      expect(typeof listenCalls[0]?.[1]).toBe('function');

      console.log = originalConsoleLog;
    });

    it('should start server with specified port when PORT env var is set', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      process.env.NODE_ENV = 'development';
      process.env.PORT = '4000';

      await import('../server.ts');

      const listenCalls = mockApp.listen.mock.calls;
      expect(listenCalls.length).toBeGreaterThan(0);
      expect(listenCalls[0]?.[0]).toBe('4000');
      expect(typeof listenCalls[0]?.[1]).toBe('function');

      console.log = originalConsoleLog;
    });

    it('should log server startup message', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';

      await import('../server.ts');

      const listenCalls = mockApp.listen.mock.calls;
      const listenCallback = listenCalls[0]?.[1] as (() => void) | undefined;

      if (!listenCallback) {
        throw new Error('Listen callback not found');
      }

      listenCallback();

      expect(console.log).toHaveBeenCalledWith('Server is running on port 3000');
      expect(console.log).toHaveBeenCalledWith(
        'API Documentation available at http://localhost:3000/api-docs',
      );

      console.log = originalConsoleLog;
    });
  });
});
