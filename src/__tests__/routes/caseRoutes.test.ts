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

jest.mock('../../controllers/CaseController.ts', () => ({
  CaseControllerInstance: {
    getAllCases: 'getAllCases-mock',
    getCaseById: 'getCaseById-mock',
    createCase: 'createCase-mock',
    updateCase: 'updateCase-mock',
    updateCaseStatus: 'updateCaseStatus-mock',
    deleteCase: 'deleteCase-mock',
  },
}));

jest.mock('../../middleware/validation.middleware', () => ({
  caseValidation: {
    create: 'create-validation-mock',
    update: 'update-validation-mock',
    updateStatus: 'updateStatus-validation-mock',
    delete: 'delete-validation-mock',
  },
  validate: 'validate-mock',
}));

jest.mock('../../middleware/pagination.middleware.ts', () => ({
  paginationMiddleware: 'pagination-middleware-mock',
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}));

describe('Case Routes', () => {
  let routesModule: any;
  let expressRouter: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    expressRouter = require('express').Router as jest.Mock;
    jest.mock('../../middleware/pagination.middleware.ts', () => ({
      paginationMiddleware: 'pagination-middleware-mock',
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 10,
      MAX_LIMIT: 100,
    }));

    routesModule = await import('../../routes/caseRoutes.js');
  });

  afterEach(() => {
    routesModule = null;
  });

  it('should set up GET / route for getAllCases with pagination middleware', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      'getAllCases-mock',
    );
  });

  it('should set up GET /:id route for getCaseById', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      'delete-validation-mock',
      'validate-mock',
      'getCaseById-mock',
    );
  });

  it('should set up POST / route for createCase', () => {
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'create-validation-mock',
      'validate-mock',
      'createCase-mock',
    );
  });

  it('should set up PUT /:id route for updateCase', () => {
    expect(mockRouter.put).toHaveBeenCalledWith(
      '/:id',
      'update-validation-mock',
      'validate-mock',
      'updateCase-mock',
    );
  });

  it('should set up PATCH /:id/status route for updateCaseStatus', () => {
    expect(mockRouter.patch).toHaveBeenCalledWith(
      '/:id/status',
      'updateStatus-validation-mock',
      'validate-mock',
      'updateCaseStatus-mock',
    );
  });

  it('should set up DELETE /:id route for deleteCase', () => {
    expect(mockRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'delete-validation-mock',
      'validate-mock',
      'deleteCase-mock',
    );
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });

  it('should import all required dependencies', () => {
    expect(expressRouter).toHaveBeenCalled();

    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      'getAllCases-mock',
    );

    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'create-validation-mock',
      'validate-mock',
      'createCase-mock',
    );
  });

  it('should create router instance', () => {
    expect(expressRouter).toHaveBeenCalledTimes(1);
    expect(expressRouter).toHaveBeenCalledWith();
  });

  it('should configure all HTTP methods correctly', () => {
    expect(mockRouter.get).toHaveBeenCalledTimes(2);
    expect(mockRouter.post).toHaveBeenCalledTimes(1);
    expect(mockRouter.put).toHaveBeenCalledTimes(1);
    expect(mockRouter.patch).toHaveBeenCalledTimes(1);
    expect(mockRouter.delete).toHaveBeenCalledTimes(1);
  });

  it('should set up GET / route for getAllCases with pagination middleware', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      'getAllCases-mock',
    );
  });

  it('should set up GET /:id route for getCaseById', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      'delete-validation-mock',
      'validate-mock',
      'getCaseById-mock',
    );
  });

  it('should set up POST / route for createCase', () => {
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'create-validation-mock',
      'validate-mock',
      'createCase-mock',
    );
  });

  it('should set up PUT /:id route for updateCase', () => {
    expect(mockRouter.put).toHaveBeenCalledWith(
      '/:id',
      'update-validation-mock',
      'validate-mock',
      'updateCase-mock',
    );
  });

  it('should set up PATCH /:id/status route for updateCaseStatus', () => {
    expect(mockRouter.patch).toHaveBeenCalledWith(
      '/:id/status',
      'updateStatus-validation-mock',
      'validate-mock',
      'updateCaseStatus-mock',
    );
  });

  it('should set up DELETE /:id route for deleteCase', () => {
    expect(mockRouter.delete).toHaveBeenCalledWith(
      '/:id',
      'delete-validation-mock',
      'validate-mock',
      'deleteCase-mock',
    );
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });

  it('should use correct route patterns', () => {
    const getCalls = (mockRouter.get as jest.Mock).mock.calls;
    const postCalls = (mockRouter.post as jest.Mock).mock.calls;
    const putCalls = (mockRouter.put as jest.Mock).mock.calls;
    const patchCalls = (mockRouter.patch as jest.Mock).mock.calls;
    const deleteCalls = (mockRouter.delete as jest.Mock).mock.calls;

    expect(getCalls[0][0]).toBe('/');
    expect(getCalls[1][0]).toBe('/:id');
    expect(postCalls[0][0]).toBe('/');
    expect(putCalls[0][0]).toBe('/:id');
    expect(patchCalls[0][0]).toBe('/:id/status');
    expect(deleteCalls[0][0]).toBe('/:id');
  });

  it('should apply middleware in correct order', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      'getAllCases-mock',
    );

    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      'create-validation-mock',
      'validate-mock',
      'createCase-mock',
    );

    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      'delete-validation-mock',
      'validate-mock',
      'getCaseById-mock',
    );
  });
});
