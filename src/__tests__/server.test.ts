import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import logSymbols from 'log-symbols';

type MockExpress = {
  (): {
    use: jest.Mock;
    get: jest.Mock;
    listen: jest.Mock;
  };
  json: jest.Mock;
  urlencoded: jest.Mock;
};

const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn(),
};

jest.mock('express', () => {
  const mockExpress = jest.fn(() => mockApp) as unknown as MockExpress;
  mockExpress.json = jest.fn();
  mockExpress.urlencoded = jest.fn();
  return mockExpress;
});

jest.mock('path', () => ({
  resolve: jest.fn((_, file) => file),
  join: jest.fn((_, ...args) => args.join('/')),
}));

jest.mock('dotenv', () => {
  return {
    config: jest.fn().mockReturnValue({ parsed: {} }),
  };
});

jest.mock('cors', () => jest.fn());

jest.mock('compression', () => jest.fn());

jest.mock('log-symbols', () => ({
  success: '✓',
  info: 'ℹ',
  error: '✖',
}));

jest.mock('../routes/index.ts', () => 'mockRoutes');

jest.mock('../utils/swagger.ts', () => ({
  setupSwagger: jest.fn(),
}));

jest.mock('../middleware/error.middleware.ts', () => ({
  errorHandler: 'mockErrorHandler',
}));

jest.mock('../middleware/logger.middleware.ts', () => ({
  requestLogger: 'mockRequestLogger',
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../middleware/security.middleware.ts', () => ({
  securityHeaders: 'mockSecurityHeaders',
  logSecurityConfig: jest.fn(),
  securityConfig: {
    contentTypeOptions: 'nosniff',
    frameOptions: 'SAMEORIGIN',
  },
}));

jest.mock('../middleware/rate-limit.middleware.ts', () => ({
  apiLimiter: 'mockApiLimiter',
  authLimiter: 'mockAuthLimiter',
}));

jest.mock('../utils/middleware.utils.ts', () => ({
  safelyApplyMiddleware: jest.fn((app, name, fn) => fn()),
}));

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe('Server', () => {
  let app: any;
  let server: any;
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalExit = process.exit;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = jest.fn() as any;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalExit;
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  describe('Environment Configuration', () => {
    it('should load environment variables from the correct file based on NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      jest.isolateModules(() => {
        require('../server');
      });
      expect(dotenv.config).toHaveBeenCalled();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      jest.isolateModules(() => {
        require('../server');
      });
      expect(dotenv.config).toHaveBeenCalled();
    });

    it('should log the environment file being loaded', () => {
      mockConsoleLog.mockClear();
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        require('../server');
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/Loading environment from \.env\.development/),
      );
    });

    it('should call logSecurityConfig to log security configuration', () => {
      const { logSecurityConfig } = require('../middleware/security.middleware.ts');
      (logSecurityConfig as jest.Mock).mockClear();
      jest.isolateModules(() => {
        require('../server');
      });
      expect(logSecurityConfig).toHaveBeenCalled();
    });
  });

  describe('Middleware Application', () => {
    it('should apply all middleware correctly', () => {
      server = require('../server');
      app = server.default;
      const { safelyApplyMiddleware } = require('../utils/middleware.utils.ts');
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(app, 'JSON parser', expect.any(Function));
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'URL encoded parser',
        expect.any(Function),
      );
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(app, 'CORS', expect.any(Function));
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'Security headers',
        expect.any(Function),
      );
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(app, 'Compression', expect.any(Function));
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'Request logger',
        expect.any(Function),
      );
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'API rate limiter',
        expect.any(Function),
      );
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'Auth rate limiter',
        expect.any(Function),
      );
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(app, 'API routes', expect.any(Function));
      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'Error handler',
        expect.any(Function),
      );
    });

    it('should apply middleware functions when safelyApplyMiddleware is called', () => {
      server = require('../server');
      app = server.default;
      expect(app.use).toHaveBeenCalled();
      expect(app.use).toHaveBeenCalledWith('mockSecurityHeaders');
      expect(app.use).toHaveBeenCalledWith('mockRequestLogger');
      expect(app.use).toHaveBeenCalledWith('/api', 'mockApiLimiter');
      expect(app.use).toHaveBeenCalledWith('/api/auth', 'mockAuthLimiter');
      expect(app.use).toHaveBeenCalledWith('/api', 'mockRoutes');
      expect(app.use).toHaveBeenCalledWith('mockErrorHandler');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should register health check endpoint', () => {
      server = require('../server');
      app = server.default;
      expect(app.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });

    it('should return correct health status based on environment', () => {
      server = require('../server');
      app = server.default;
      const healthHandler = (app.get as jest.Mock).mock.calls.find(
        (call) => call[0] === '/health',
      )[1];

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      process.env.NODE_ENV = 'production';
      healthHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        environment: 'production',
        securityEnabled: true,
      });

      jest.clearAllMocks();

      process.env.NODE_ENV = 'development';
      healthHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        environment: 'development',
      });
    });
  });

  describe('Swagger Documentation', () => {
    it('should set up Swagger when setupSwagger is a function', () => {
      server = require('../server');
      app = server.default;

      const { setupSwagger } = require('../utils/swagger.ts');
      const { safelyApplyMiddleware } = require('../utils/middleware.utils.ts');

      expect(safelyApplyMiddleware).toHaveBeenCalledWith(
        app,
        'Swagger documentation',
        expect.any(Function),
      );

      const setupSwaggerFn = (safelyApplyMiddleware as jest.Mock).mock.calls.find(
        (call) => call[1] === 'Swagger documentation',
      )[2];

      setupSwaggerFn();

      expect(setupSwagger).toHaveBeenCalledWith(app);
    });

    it('should not set up Swagger when setupSwagger is not a function', () => {
      jest.resetModules();
      jest.mock('../utils/swagger.ts', () => ({
        setupSwagger: 'not a function',
      }));

      server = require('../server');
      app = server.default;

      const { safelyApplyMiddleware } = require('../utils/middleware.utils.ts');

      const swaggerCall = (safelyApplyMiddleware as jest.Mock).mock.calls.find(
        (call) => call[1] === 'Swagger documentation',
      );

      expect(swaggerCall).toBeUndefined();
    });
  });

  describe('Server Startup', () => {
    it('should start the server when NODE_ENV is not test', () => {
      jest.clearAllMocks();

      (mockApp.listen as jest.Mock).mockImplementation((port, callback) => {
        if (callback) callback();
        return mockApp;
      });

      console.log = jest.fn().mockImplementation((symbol, message) => {
        if (message && message.includes && message.includes('Server is running on port')) {
          mockConsoleLog(symbol, message);
        }
      });

      process.env.NODE_ENV = 'development';
      jest.resetModules();
      server = require('../server');
      app = server.default;

      expect(app.listen).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should not start the server when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      server = require('../server');
      app = server.default;

      expect(app.listen).not.toHaveBeenCalled();
    });

    it('should use default port 3000 when PORT is not set', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.PORT;
      jest.resetModules();
      server = require('../server');
      app = server.default;

      expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it('should handle server startup errors', () => {
      mockConsoleError.mockClear();
      process.env.NODE_ENV = 'development';

      (mockApp.listen as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Server startup error');
      });

      jest.resetModules();
      server = require('../server');
      app = server.default;

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleError.mock.calls[0][0]).toBe('✖');
      expect(mockConsoleError.mock.calls[0][1]).toBe(' Failed to start server:');
      expect(mockConsoleError.mock.calls[0][2]).toBe('Server startup error');

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects in server startup errors', () => {
      mockConsoleError.mockClear();
      process.env.NODE_ENV = 'development';

      (mockApp.listen as jest.Mock).mockImplementationOnce(() => {
        throw 'String error';
      });

      jest.resetModules();
      server = require('../server');
      app = server.default;

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleError.mock.calls[0][0]).toBe('✖');
      expect(mockConsoleError.mock.calls[0][1]).toBe(' Failed to start server:');
      expect(mockConsoleError.mock.calls[0][2]).toBe('Unknown error');

      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
