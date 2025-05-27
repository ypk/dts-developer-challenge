const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  return undefined as never;
}) as (code?: string | number | null) => never);

const TEST_CONFIG = {
  PORTS: {
    DEFAULT: 3000,
    ALTERNATIVE: 8080,
    STRING_DEFAULT: '3000',
    STRING_ALTERNATIVE: '8080',
  },
  ENVIRONMENTS: {
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
    TEST: 'test',
  },
  MESSAGES: {
    SESSION_SECRET_ERROR: 'ERROR: SESSION_SECRET environment variable is required in production',
    SESSION_SECRET_WARNING:
      'WARNING: Using randomly generated session secret. Sessions will be invalidated on server restart.',
    SERVER_RUNNING: (port: string | number) => ` Server is running on port ${port}`,
    API_DOCS: (port: string | number) =>
      ` API Documentation available at http://localhost:${port}/api-docs`,
    SERVER_START_ERROR: ' Failed to start server:',
    UNKNOWN_ERROR: 'Unknown error',
  },
  ASSETS_PATH: '/assets',
} as const;

class ServerTestHelper {
  private originalEnv: Record<string, string | undefined> = {};

  setEnv(vars: Record<string, string | undefined>) {
    Object.entries(vars).forEach(([key, value]) => {
      this.originalEnv[key] = process.env[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }

  restoreEnv() {
    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
    this.originalEnv = {};
  }
}

class MockManager {
  private mocks: Map<string, jest.SpyInstance> = new Map();

  spy(object: any, method: string, implementation?: any): jest.SpyInstance {
    const spy = jest.spyOn(object, method);
    if (implementation) spy.mockImplementation(implementation);
    this.mocks.set(`${object.constructor.name}.${method}`, spy);
    return spy;
  }

  restoreAll() {
    this.mocks.forEach((mock) => mock.mockRestore());
    this.mocks.clear();
  }

  clearAll() {
    this.mocks.forEach((mock) => mock.mockClear());
  }
}

const createMockApp = (overrides: Partial<any> = {}) => ({
  use: jest.fn(),
  set: jest.fn().mockReturnThis(),
  get: jest.fn(),
  listen: jest.fn(),
  ...overrides,
});

const createSuccessfulListenMock = () =>
  jest.fn((port: string | number, callback: Function) => {
    setTimeout(() => callback(), 0);
    return {};
  });

const createFailingListenMock = (error: any) =>
  jest.fn(() => {
    throw error;
  });

const setupExpressMock = (mockApp: any) => {
  jest.doMock('express', () => {
    const mockExpress: any = jest.fn(() => mockApp);
    mockExpress.json = jest.fn(() => jest.fn());
    mockExpress.urlencoded = jest.fn(() => jest.fn());
    mockExpress.static = jest.fn(() => jest.fn());
    mockExpress.Router = jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      use: jest.fn(),
    }));
    return mockExpress;
  });
};

const setupAllMocks = () => {
  jest.doMock('dotenv', () => ({ config: jest.fn() }));
  jest.doMock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/')),
    dirname: jest.fn(),
  }));
  jest.doMock('cors', () => jest.fn());
  jest.doMock('compression', () => jest.fn());
  jest.doMock('log-symbols', () => ({
    success: '✓',
    info: 'ℹ',
    error: '✗',
  }));
  jest.doMock('../routes/api.routes.ts', () => jest.fn());
  jest.doMock('../routes/frontend.routes.ts', () => jest.fn());
  jest.doMock('express-ejs-layouts', () => jest.fn());
  jest.doMock('express-dart-sass', () => jest.fn());
  jest.doMock('express-session', () => jest.fn());
  jest.doMock('connect-flash', () => jest.fn());
  jest.doMock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-secret'),
    }),
  }));
  jest.doMock('../utils/swagger.ts', () => ({ setupSwagger: jest.fn() }));
  jest.doMock('../middleware/error.middleware.ts', () => ({
    APIErrorHandler: jest.fn(),
    FrontEndErrorHandler: jest.fn(),
  }));
  jest.doMock('../middleware/logger.middleware.ts', () => ({
    requestLogger: jest.fn(),
  }));
  jest.doMock('../middleware/security.middleware.ts', () => ({
    securityHeaders: jest.fn(),
    logSecurityConfig: jest.fn(),
  }));
  jest.doMock('../middleware/rate-limit.middleware.ts', () => ({
    apiLimiter: jest.fn(),
    authLimiter: jest.fn(),
  }));
  jest.doMock('../utils/viewHelpers.ts', () => ({
    getFormData: jest.fn(),
    hasError: jest.fn(),
    getErrorMessage: jest.fn(),
  }));
};

class MiddlewareCapture {
  private capturedMiddleware: Function[] = [];
  private namedMiddleware: Map<string, Function> = new Map();

  setupCapture(mockApp: any) {
    mockApp.use = jest.fn((pathOrMiddleware: any, middleware?: Function) => {
      if (typeof pathOrMiddleware === 'function') {
        this.capturedMiddleware.push(pathOrMiddleware);
      } else if (typeof middleware === 'function') {
        this.capturedMiddleware.push(middleware);
      }
    });
  }

  captureNamedMiddleware(name: string, fn: Function) {
    const initialCount = this.capturedMiddleware.length;
    try {
      fn();
    } catch (error) {
      /* Ignore errors */
    }

    if (this.capturedMiddleware.length > initialCount) {
      this.namedMiddleware.set(name, this.capturedMiddleware[this.capturedMiddleware.length - 1]);
    }
  }

  getMiddleware(name: string): Function | undefined {
    return this.namedMiddleware.get(name);
  }

  clear() {
    this.capturedMiddleware = [];
    this.namedMiddleware.clear();
  }
}

class RouteCapture {
  private handlers: Map<string, Function> = new Map();

  setupCapture(mockApp: any) {
    mockApp.get = jest.fn((path: string, handler: Function) => {
      this.handlers.set(path, handler);
    });
  }

  getHandler(path: string): Function | undefined {
    return this.handlers.get(path);
  }

  clear() {
    this.handlers.clear();
  }
}

const assertServerStartSuccess = (
  mockApp: any,
  mockConsoleLog: jest.SpyInstance,
  port: string | number,
) => {
  expect(mockApp.listen).toHaveBeenCalledWith(port, expect.any(Function));
  expect(mockConsoleLog).toHaveBeenCalledWith('✓', TEST_CONFIG.MESSAGES.SERVER_RUNNING(port));
  expect(mockConsoleLog).toHaveBeenCalledWith('ℹ', TEST_CONFIG.MESSAGES.API_DOCS(port));
};

const assertServerStartFailure = (mockConsoleError: jest.SpyInstance, errorMessage: string) => {
  expect(mockConsoleError).toHaveBeenCalledWith(
    '✗',
    TEST_CONFIG.MESSAGES.SERVER_START_ERROR,
    errorMessage,
  );
  expect(mockProcessExit).toHaveBeenCalledWith(1);
};

const assertHealthResponse = (
  mockRes: any,
  environment: string | undefined,
  hasSecurityEnabled = false,
) => {
  expect(mockRes.status).toHaveBeenCalledWith(200);

  const expectedResponse: any = {
    status: 'ok',
    environment,
  };

  if (hasSecurityEnabled) {
    expectedResponse.securityEnabled = true;
  }

  expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
};

describe('Server Configuration', () => {
  let testHelper: ServerTestHelper;
  let mockManager: MockManager;
  let middlewareCapture: MiddlewareCapture;
  let routeCapture: RouteCapture;

  beforeEach(() => {
    testHelper = new ServerTestHelper();
    mockManager = new MockManager();
    middlewareCapture = new MiddlewareCapture();
    routeCapture = new RouteCapture();

    jest.clearAllMocks();
    jest.resetModules();
    mockProcessExit.mockClear();

    setupAllMocks();
    testHelper.setEnv({
      NODE_ENV: TEST_CONFIG.ENVIRONMENTS.TEST,
      SESSION_SECRET: 'test-secret',
    });
  });

  afterEach(() => {
    testHelper.restoreEnv();
    mockManager.restoreAll();
    middlewareCapture.clear();
    routeCapture.clear();
  });

  afterAll(() => {
    mockProcessExit.mockRestore();
  });

  describe('Session Secret Handling', () => {
    describe('Production Environment', () => {
      it('should exit with error when SESSION_SECRET is missing', async () => {
        const mockConsoleError = mockManager.spy(console, 'error', jest.fn());

        testHelper.setEnv({
          NODE_ENV: TEST_CONFIG.ENVIRONMENTS.PRODUCTION,
          SESSION_SECRET: undefined,
        });

        const mockApp = createMockApp();
        setupExpressMock(mockApp);

        jest.doMock('../utils/middleware.utils.ts', () => ({
          safelyApplyMiddleware: jest.fn(),
          getSVG: jest.fn(),
          formatStatus: jest.fn(),
        }));

        await import('../server.ts');

        expect(mockConsoleError).toHaveBeenCalledWith(TEST_CONFIG.MESSAGES.SESSION_SECRET_ERROR);
        expect(mockProcessExit).toHaveBeenCalledWith(1);
      });
    });

    describe('Non-Production Environment', () => {
      it.each([[TEST_CONFIG.ENVIRONMENTS.DEVELOPMENT], [TEST_CONFIG.ENVIRONMENTS.TEST]])(
        'should warn when SESSION_SECRET is missing in %s',
        async (environment) => {
          const mockConsoleWarn = mockManager.spy(console, 'warn', jest.fn());

          testHelper.setEnv({
            NODE_ENV: environment,
            SESSION_SECRET: undefined,
          });

          const mockApp = createMockApp();
          setupExpressMock(mockApp);

          jest.doMock('../utils/middleware.utils.ts', () => ({
            safelyApplyMiddleware: jest.fn(),
            getSVG: jest.fn(),
            formatStatus: jest.fn(),
          }));

          await import('../server.ts');

          expect(mockConsoleWarn).toHaveBeenCalledWith(TEST_CONFIG.MESSAGES.SESSION_SECRET_WARNING);
          expect(mockProcessExit).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe('Middleware Setup', () => {
    let mockApp: any;

    beforeEach(() => {
      mockApp = createMockApp();
      middlewareCapture.setupCapture(mockApp);
      setupExpressMock(mockApp);

      jest.doMock('../utils/middleware.utils.ts', () => ({
        safelyApplyMiddleware: jest.fn(),
        getSVG: jest.fn().mockReturnValue('<svg>mock</svg>'),
        formatStatus: jest.fn(),
      }));
    });

    describe('SVG Helper Middleware', () => {
      it('should add getSVG function to res.locals', async () => {
        const { safelyApplyMiddleware } = await import('../utils/middleware.utils.ts');

        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            middlewareCapture.captureNamedMiddleware(name, fn);
          },
        );

        await import('../server.ts');

        const svgMiddleware = middlewareCapture.getMiddleware('SVG Helper');
        expect(svgMiddleware).toBeDefined();

        if (svgMiddleware) {
          const mockReq = {};
          const mockRes = { locals: {} as { getSVG: Function } };
          const mockNext = jest.fn();

          svgMiddleware(mockReq, mockRes, mockNext);

          expect(mockRes.locals.getSVG).toBeDefined();
          expect(typeof mockRes.locals.getSVG).toBe('function');
        }
      });

      it('should call next() after setup', async () => {
        const { safelyApplyMiddleware } = await import('../utils/middleware.utils.ts');

        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            middlewareCapture.captureNamedMiddleware(name, fn);
          },
        );

        await import('../server.ts');

        const svgMiddleware = middlewareCapture.getMiddleware('SVG Helper');

        if (svgMiddleware) {
          const mockNext = jest.fn();
          svgMiddleware({}, { locals: {} }, mockNext);
          expect(mockNext).toHaveBeenCalled();
        }
      });

      it('should use getSVG function correctly', async () => {
        const { safelyApplyMiddleware, getSVG } = await import('../utils/middleware.utils.ts');

        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            middlewareCapture.captureNamedMiddleware(name, fn);
          },
        );

        await import('../server.ts');

        const svgMiddleware = middlewareCapture.getMiddleware('SVG Helper');

        if (svgMiddleware) {
          const mockRes = { locals: {} as { getSVG: Function } };
          svgMiddleware({}, mockRes, jest.fn());

          const result = mockRes.locals.getSVG('test-icon.svg');
          expect(getSVG).toHaveBeenCalledWith('test-icon.svg');
          expect(result).toBe('<svg>mock</svg>');
        }
      });
    });

    describe('Method Override Middleware', () => {
      let methodOverrideHandler: Function | undefined;

      beforeEach(async () => {
        jest.doMock('method-override', () => {
          return jest.fn((handlerFn: Function) => {
            methodOverrideHandler = handlerFn;
            return jest.fn();
          });
        });

        const { safelyApplyMiddleware } = await import('../utils/middleware.utils.ts');
        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            try {
              fn();
            } catch (error) {
              /* ignore */
            }
          },
        );

        await import('../server.ts');
      });

      it('should extract _method from request body', () => {
        expect(methodOverrideHandler).toBeDefined();

        if (methodOverrideHandler) {
          const mockReq = {
            body: {
              _method: 'PUT',
              title: 'Test Case',
              description: 'Test Description',
            },
          };

          const result = methodOverrideHandler(mockReq, {});

          expect(result).toBe('PUT');
          expect(mockReq.body._method).toBeUndefined();
          expect(mockReq.body.title).toBe('Test Case');
          expect(mockReq.body.description).toBe('Test Description');
        }
      });

      it.each([
        ['no _method in body', { title: 'Test' }],
        ['null body', null],
        ['string body', 'string body'],
        ['undefined body', undefined],
      ])('should handle %s gracefully', (_, body) => {
        if (methodOverrideHandler) {
          const mockReq = { body };
          expect(methodOverrideHandler(mockReq, {})).toBeUndefined();
        }
      });
    });

    describe('Session & Template Locals Middleware', () => {
      it('should set all required locals', async () => {
        const { safelyApplyMiddleware } = await import('../utils/middleware.utils.ts');

        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            middlewareCapture.captureNamedMiddleware(name, fn);
          },
        );

        await import('../server.ts');

        const sessionMiddleware = middlewareCapture.getMiddleware('Session & Template Locals');
        expect(sessionMiddleware).toBeDefined();

        if (sessionMiddleware) {
          const mockReq = {
            flash: jest.fn((type: string) => {
              if (type === 'success') return ['Success message'];
              if (type === 'error') return ['Error message'];
              return [];
            }),
            session: { userId: 123, username: 'testuser' },
            path: '/cases/1',
          };
          const mockRes = { locals: {} as any };
          const mockNext = jest.fn();

          sessionMiddleware(mockReq, mockRes, mockNext);

          expect(mockRes.locals.messages).toEqual({
            success: ['Success message'],
            error: ['Error message'],
          });
          expect(mockRes.locals.paths).toEqual({
            assets: TEST_CONFIG.ASSETS_PATH,
          });
          expect(mockRes.locals.session).toEqual({ userId: 123, username: 'testuser' });
          expect(mockRes.locals.currentPath).toBe('/cases/1');
          expect(mockRes.locals.formatStatus).toBeDefined();
          expect(mockRes.locals.viewHelpers).toBeDefined();
          expect(mockNext).toHaveBeenCalled();
        }
      });

      it('should handle empty/null values', async () => {
        const { safelyApplyMiddleware } = await import('../utils/middleware.utils.ts');

        (safelyApplyMiddleware as jest.Mock).mockImplementation(
          (app: any, name: string, fn: Function) => {
            middlewareCapture.captureNamedMiddleware(name, fn);
          },
        );

        await import('../server.ts');

        const sessionMiddleware = middlewareCapture.getMiddleware('Session & Template Locals');

        if (sessionMiddleware) {
          const mockReq = {
            flash: jest.fn(() => []),
            session: null,
            path: undefined,
          };
          const mockRes = { locals: {} as any };
          const mockNext = jest.fn();

          sessionMiddleware(mockReq, mockRes, mockNext);

          expect(mockRes.locals.messages).toEqual({
            success: [],
            error: [],
          });
          expect(mockRes.locals.session).toBeNull();
          expect(mockRes.locals.currentPath).toBeUndefined();
          expect(mockNext).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Health Endpoint', () => {
    let mockApp: any;

    beforeEach(() => {
      mockApp = createMockApp();
      routeCapture.setupCapture(mockApp);
      setupExpressMock(mockApp);

      jest.doMock('../utils/middleware.utils.ts', () => ({
        safelyApplyMiddleware: jest.fn((app: any, name: string, fn: Function) => {
          try {
            fn();
          } catch (error) {
            /* ignore */
          }
        }),
        getSVG: jest.fn(),
        formatStatus: jest.fn(),
      }));
    });

    it.each([
      [TEST_CONFIG.ENVIRONMENTS.DEVELOPMENT, false],
      [TEST_CONFIG.ENVIRONMENTS.TEST, false],
      [undefined, false],
    ])(
      'should return correct response in %s environment',
      async (environment, hasSecurityEnabled) => {
        testHelper.setEnv({ NODE_ENV: environment });

        await import('../server.ts');

        const healthHandler = routeCapture.getHandler('/health');
        expect(healthHandler).toBeDefined();

        if (healthHandler) {
          const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
          };

          healthHandler({}, mockRes);
          assertHealthResponse(mockRes, environment, hasSecurityEnabled);
        }
      },
    );

    it('should include securityEnabled in production', async () => {
      testHelper.setEnv({ NODE_ENV: TEST_CONFIG.ENVIRONMENTS.PRODUCTION });

      await import('../server.ts');

      const healthHandler = routeCapture.getHandler('/health');

      if (healthHandler) {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        healthHandler({}, mockRes);
        assertHealthResponse(mockRes, TEST_CONFIG.ENVIRONMENTS.PRODUCTION, true);
      }
    });
  });

  describe('Server Startup', () => {
    describe('Success Cases', () => {
      it.each([
        [
          'string port from env',
          TEST_CONFIG.ENVIRONMENTS.DEVELOPMENT,
          TEST_CONFIG.PORTS.STRING_DEFAULT,
        ],
        ['numeric default port', TEST_CONFIG.ENVIRONMENTS.DEVELOPMENT, undefined],
      ])('should start successfully with %s', async (_, environment, port) => {
        const mockConsoleLog = mockManager.spy(console, 'log', jest.fn());
        const expectedPort = port || TEST_CONFIG.PORTS.DEFAULT;

        testHelper.setEnv({
          NODE_ENV: environment,
          PORT: port,
          SESSION_SECRET: 'test-secret',
        });

        const mockApp = createMockApp({
          listen: createSuccessfulListenMock(),
        });
        setupExpressMock(mockApp);

        jest.doMock('../utils/middleware.utils.ts', () => ({
          safelyApplyMiddleware: jest.fn(),
          getSVG: jest.fn(),
          formatStatus: jest.fn(),
        }));

        await import('../server.ts');
        await new Promise((resolve) => setTimeout(resolve, 10));

        assertServerStartSuccess(mockApp, mockConsoleLog, expectedPort);
        expect(mockProcessExit).not.toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it.each([
        ['Error object', new Error('Port already in use'), 'Port already in use'],
        ['TypeError', new TypeError('Invalid port'), 'Invalid port'],
        ['string error', 'String error', TEST_CONFIG.MESSAGES.UNKNOWN_ERROR],
        ['null error', null, TEST_CONFIG.MESSAGES.UNKNOWN_ERROR],
        ['undefined error', undefined, TEST_CONFIG.MESSAGES.UNKNOWN_ERROR],
      ])('should handle %s gracefully', async (_, error, expectedMessage) => {
        const mockConsoleError = mockManager.spy(console, 'error', jest.fn());

        testHelper.setEnv({
          NODE_ENV: TEST_CONFIG.ENVIRONMENTS.PRODUCTION,
          PORT: TEST_CONFIG.PORTS.STRING_DEFAULT,
          SESSION_SECRET: 'test-secret',
        });

        const mockApp = createMockApp({
          listen: createFailingListenMock(error),
        });
        setupExpressMock(mockApp);

        jest.doMock('../utils/middleware.utils.ts', () => ({
          safelyApplyMiddleware: jest.fn(),
          getSVG: jest.fn(),
          formatStatus: jest.fn(),
        }));

        await import('../server.ts');

        expect(mockApp.listen).toHaveBeenCalledWith(
          TEST_CONFIG.PORTS.STRING_DEFAULT,
          expect.any(Function),
        );
        assertServerStartFailure(mockConsoleError, expectedMessage);
      });
    });

    describe('Test Environment', () => {
      it('should skip server startup in test environment', async () => {
        testHelper.setEnv({
          NODE_ENV: TEST_CONFIG.ENVIRONMENTS.TEST,
          SESSION_SECRET: 'test-secret',
        });

        const mockApp = createMockApp();
        setupExpressMock(mockApp);

        jest.doMock('../utils/middleware.utils.ts', () => ({
          safelyApplyMiddleware: jest.fn(),
          getSVG: jest.fn(),
          formatStatus: jest.fn(),
        }));

        await import('../server.ts');

        expect(mockApp.listen).not.toHaveBeenCalled();
        expect(mockProcessExit).not.toHaveBeenCalled();
      });
    });
  });
});
