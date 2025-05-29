const mockRouter = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockCaseRoutes = 'mock-case-routes';

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

jest.mock('../../routes/caseRoutes.ts', () => mockCaseRoutes);

describe('API Routes Module', () => {
  let routesModule: any;
  let expressRouter: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    expressRouter = require('express').Router as jest.Mock;
    routesModule = await import('../../routes/api.routes.js');
  });

  afterEach(() => {
    routesModule = null;
  });

  describe('Module imports and setup', () => {
    it('should import Router from express', () => {
      expect(expressRouter).toHaveBeenCalled();
    });

    it('should create a router instance', () => {
      expect(expressRouter).toHaveBeenCalledTimes(1);
      expect(expressRouter).toHaveBeenCalledWith();
    });

    it('should import caseRoutes module', () => {
      const caseRoutesModule = jest.requireMock('../../routes/caseRoutes.ts');
      expect(caseRoutesModule).toBe(mockCaseRoutes);
    });
  });

  describe('Route configuration', () => {
    it('should mount case routes under /cases path', () => {
      expect(mockRouter.use).toHaveBeenCalledWith('/cases', mockCaseRoutes);
      expect(mockRouter.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('Module exports', () => {
    it('should export the configured router as default export', () => {
      expect(routesModule.default).toBe(mockRouter);
    });
  });
});
