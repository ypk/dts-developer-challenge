/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

jest.mock('../../controllers/caseController.ts', () => ({
  caseController: {
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

describe('Case Routes', () => {
  let routesModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    routesModule = await import('../../routes/caseRoutes.ts');
  });

  afterEach(() => {
    routesModule = null;
  });

  it('should set up GET / route for getAllCases', () => {
    expect(mockRouter.get).toHaveBeenCalledWith('/', 'getAllCases-mock');
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
});
