import { jest } from '@jest/globals';
import { Request, Response } from 'express';

const mockUse = jest.fn();
const mockGet = jest.fn();
const mockListen = jest.fn().mockImplementation((port, callback) => {
  if (callback && typeof callback === 'function') callback();
  return { on: jest.fn() };
});

const mockApp = {
  use: mockUse,
  get: mockGet,
  listen: mockListen,
};

const mockExpressJson = jest.fn().mockReturnValue('json-middleware');
const mockExpressUrlencoded = jest.fn().mockReturnValue('urlencoded-middleware');

type ExtendedMockFunction = jest.Mock & {
  json: jest.Mock;
  urlencoded: jest.Mock;
};

jest.mock('express', () => {
  const mockExpress = jest.fn(() => mockApp);

  return Object.assign(mockExpress, {
    json: mockExpressJson,
    urlencoded: mockExpressUrlencoded,
  }) as ExtendedMockFunction;
});

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('cors', () => jest.fn().mockReturnValue('cors-middleware'));
jest.mock('compression', () => jest.fn().mockReturnValue('compression-middleware'));

const mockSetupSwagger = jest.fn();
jest.mock('../utils/swagger.ts', () => ({
  setupSwagger: mockSetupSwagger,
}));

jest.mock('../middleware/error.middleware.ts', () => ({
  errorHandler: 'error-handler-middleware',
}));

jest.mock('../middleware/logger.middleware.ts', () => ({
  requestLogger: 'logger-middleware',
}));

jest.mock('../middleware/security.middleware.ts', () => ({
  securityHeaders: 'security-headers-middleware',
}));

jest.mock('../middleware/rate-limit.middleware.ts', () => ({
  apiLimiter: 'api-limiter-middleware',
  authLimiter: 'auth-limiter-middleware',
}));

const mockSafelyApplyMiddleware = jest.fn();
jest.mock('../utils/middleware.utils.ts', () => ({
  safelyApplyMiddleware: mockSafelyApplyMiddleware,
}));

jest.mock('../routes/index.ts', () => 'route-handlers');

jest.mock('log-symbols', () => ({
  success: '✓',
  error: '✖',
  info: 'ℹ',
}));

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = jest.fn();
console.error = jest.fn();

const originalProcessExit = process.exit;
process.exit = jest.fn() as unknown as typeof process.exit;

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
  });

  afterEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe('Middleware Application', () => {
    it('should apply all middleware correctly', async () => {
      await import('../server.ts');

      expect(mockSafelyApplyMiddleware).toHaveBeenCalledTimes(11);
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'JSON parser',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'URL encoded parser',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(mockApp, 'CORS', expect.any(Function));
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Security headers',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Compression',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Request logger',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'API rate limiter',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Auth rate limiter',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'API routes',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Swagger documentation',
        expect.any(Function),
      );
      expect(mockSafelyApplyMiddleware).toHaveBeenCalledWith(
        mockApp,
        'Error handler',
        expect.any(Function),
      );
    });

    it('should apply middleware functions when safelyApplyMiddleware is called', async () => {
      mockSafelyApplyMiddleware.mockImplementation((app, name, fn) => {
        if (typeof fn === 'function') fn();
      });

      await import('../server.ts');

      expect(mockUse).toHaveBeenCalledWith('json-middleware');
      expect(mockUse).toHaveBeenCalledWith('urlencoded-middleware');
      expect(mockUse).toHaveBeenCalledWith('cors-middleware');
      expect(mockUse).toHaveBeenCalledWith('security-headers-middleware');
      expect(mockUse).toHaveBeenCalledWith('compression-middleware');
      expect(mockUse).toHaveBeenCalledWith('logger-middleware');
      expect(mockUse).toHaveBeenCalledWith('/api', 'api-limiter-middleware');
      expect(mockUse).toHaveBeenCalledWith('/api/auth', 'auth-limiter-middleware');
      expect(mockUse).toHaveBeenCalledWith('/api', 'route-handlers');
      expect(mockUse).toHaveBeenCalledWith('error-handler-middleware');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should register health check endpoint', async () => {
      await import('../server.ts');

      expect(mockGet).toHaveBeenCalledWith('/health', expect.any(Function));

      const healthCall = mockGet.mock.calls.find((call) => call[0] === '/health');

      if (!healthCall) {
        fail('Health endpoint was not registered');
        return;
      }

      const healthHandler = healthCall[1];

      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      if (typeof healthHandler === 'function') {
        (healthHandler as (req: Request, res: Response) => void)(req, res);
      } else {
        fail('Health handler is not a function');
      }

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('Swagger Documentation', () => {
    it('should set up Swagger when setupSwagger is a function', async () => {
      await import('../server.ts');

      const swaggerCall = mockSafelyApplyMiddleware.mock.calls.find(
        (call) => call[1] === 'Swagger documentation',
      );

      if (swaggerCall) {
        const callback = swaggerCall[2];
        if (typeof callback === 'function') callback();
      }

      expect(mockSetupSwagger).toHaveBeenCalledWith(mockApp);
    });

    it('should not set up Swagger when setupSwagger is not a function', async () => {
      jest.resetModules();
      jest.mock('../utils/swagger.ts', () => ({
        setupSwagger: 'not-a-function',
      }));

      await import('../server.ts');

      const middlewareNames = mockSafelyApplyMiddleware.mock.calls.map((call) => call[1]);

      expect(middlewareNames).not.toContain('Swagger documentation');
    });
  });

  describe('Server Startup', () => {
    it('should start the server when NODE_ENV is not test', async () => {
      process.env.NODE_ENV = 'development';

      await import('../server.ts');

      expect(mockListen).toHaveBeenCalledWith('3000', expect.any(Function));
      expect(console.log).toHaveBeenCalledWith(
        '✓',
        expect.stringContaining('Server is running on port 3000'),
      );
      expect(console.log).toHaveBeenCalledWith(
        'ℹ',
        expect.stringContaining('API Documentation available'),
      );
    });

    it('should not start the server when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';

      await import('../server.ts');

      expect(mockListen).not.toHaveBeenCalled();
    });

    it('should use default port 3000 when PORT is not set', async () => {
      delete process.env.PORT;
      process.env.NODE_ENV = 'development';

      await import('../server.ts');

      expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it('should handle server startup errors', async () => {
      process.env.NODE_ENV = 'development';
      const testError = new Error('Test server startup error');
      mockListen.mockImplementationOnce(() => {
        throw testError;
      });

      await import('../server.ts');

      expect(console.error).toHaveBeenCalledWith(
        '✖',
        expect.stringContaining('Failed to start server:'),
        'Test server startup error',
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects in server startup errors', async () => {
      process.env.NODE_ENV = 'development';
      mockListen.mockImplementationOnce(() => {
        throw 'String error';
      });

      await import('../server.ts');

      expect(console.error).toHaveBeenCalledWith(
        '✖',
        expect.stringContaining('Failed to start server:'),
        'Unknown error',
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
