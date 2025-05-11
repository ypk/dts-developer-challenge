const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

// Mock the container to return a mock controller
jest.mock('../../di/container.ts', () => ({
  container: {
    get: jest.fn(() => ({
      getAllCases: jest.fn(),
      getCaseById: jest.fn(),
      createCase: jest.fn(),
      updateCase: jest.fn(),
      updateCaseStatus: jest.fn(),
      deleteCase: jest.fn(),
    })),
  },
}));

// Mock the validation middleware
jest.mock('../../middleware/validation.middleware', () => ({
  validateCreateCase: 'validateCreateCase-mock',
  validateUpdateCase: 'validateUpdateCase-mock',
  validateUpdateStatus: 'validateUpdateStatus-mock',
  validateDeleteCase: 'validateDeleteCase-mock',
}));

// Mock the pagination middleware
jest.mock('../../middleware/pagination.middleware.ts', () => ({
  paginationMiddleware: 'pagination-middleware-mock',
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}));

describe('Case Routes', () => {
  let routesModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Import the routes module
    routesModule = await import('../../routes/caseRoutes.ts');
  });

  afterEach(() => {
    routesModule = null;
  });

  it('should set up GET / route for getAllCases with pagination middleware', () => {
    // Check that the route was registered with pagination middleware
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      expect.any(Function),
    );
  });

  it('should set up GET /:id route for getCaseById', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      'validateDeleteCase-mock',
      expect.any(Function),
    );
  });

  it('should set up POST / route for createCase', () => {
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'validateCreateCase-mock',
      expect.any(Function),
    );
  });

  it('should set up PUT /:id route for updateCase', () => {
    expect(mockRouter.put).toHaveBeenCalledWith(
      '/:id',
      'validateUpdateCase-mock',
      expect.any(Function),
    );
  });

  it('should set up PATCH /:id/status route for updateCaseStatus', () => {
    expect(mockRouter.patch).toHaveBeenCalledWith(
      '/:id/status',
      'validateUpdateStatus-mock',
      expect.any(Function),
    );
  });

  it('should set up DELETE /:id route for deleteCase', () => {
    expect(mockRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'validateDeleteCase-mock',
      expect.any(Function),
    );
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });
});
