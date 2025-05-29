const mockRouter = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

describe('Frontend Routes Module', () => {
  let routesModule: any;
  let expressRouter: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    expressRouter = require('express').Router as jest.Mock;
    routesModule = await import('../../routes/frontend.routes.js');
  });

  afterEach(() => {
    routesModule = null;
  });

  describe('Module imports and setup', () => {
    it('should import Router from express', () => {
      expect(expressRouter).toHaveBeenCalled();
    });

    it('should create router instances as needed', () => {
      expect(expressRouter).toHaveBeenCalled();
      expect(expressRouter).toHaveBeenCalledWith();

      expect(routesModule.default).toBeDefined();
    });
  });

  describe('Module exports', () => {
    it('should export the configured router as default export', () => {
      expect(routesModule.default).toBe(mockRouter);
    });
  });
});
