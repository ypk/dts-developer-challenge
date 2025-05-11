import { TYPES } from '../../di/types.ts';

const mockCaseController = {
  getAllCases: jest.fn(),
  getCaseById: jest.fn(),
  createCase: jest.fn(),
  updateCase: jest.fn(),
  updateCaseStatus: jest.fn(),
  deleteCase: jest.fn(),
};

const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

jest.mock('../../di/container.ts', () => ({
  container: {
    get: jest.fn().mockImplementation((type) => {
      if (type === TYPES.CaseController) {
        return mockCaseController;
      }
      return jest.fn();
    }),
  },
}));

jest.mock('../../middleware/validation.middleware.ts', () => ({
  validateCreateCase: ['validateCreateCase-mock'],
  validateUpdateCase: ['validateUpdateCase-mock'],
  validateUpdateStatus: ['validateUpdateStatus-mock'],
  validateDeleteCase: ['validateDeleteCase-mock'],
}));

jest.mock('../../middleware/pagination.middleware.ts', () => ({
  paginationMiddleware: 'pagination-middleware-mock',
}));

describe('Case Routes', () => {
  let routesModule;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.resetModules();

    routesModule = require('../../routes/caseRoutes.ts');
  });

  it('should get the CaseController from the container', () => {
    const { container } = require('../../di/container.ts');

    expect(container.get).toHaveBeenCalledWith(TYPES.CaseController);
  });

  it('should set up GET / route for getAllCases with pagination middleware', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/',
      'pagination-middleware-mock',
      expect.any(Function),
    );

    const routeHandler = mockRouter.get.mock.calls[0][2];

    const req = {};
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.getAllCases).toHaveBeenCalledWith(req, res);
  });

  it('should set up GET /:id route for getCaseById', () => {
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/:id',
      ['validateDeleteCase-mock'],
      expect.any(Function),
    );

    const routeHandler = mockRouter.get.mock.calls[1][2];

    const req = { params: { id: '1' } };
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.getCaseById).toHaveBeenCalledWith(req, res);
  });

  it('should set up POST / route for createCase', () => {
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/',
      ['validateCreateCase-mock'],
      expect.any(Function),
    );

    const routeHandler = mockRouter.post.mock.calls[0][2];

    const req = { body: { title: 'Test Case' } };
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.createCase).toHaveBeenCalledWith(req, res);
  });

  it('should set up PUT /:id route for updateCase', () => {
    expect(mockRouter.put).toHaveBeenCalledWith(
      '/:id',
      ['validateUpdateCase-mock'],
      expect.any(Function),
    );

    const routeHandler = mockRouter.put.mock.calls[0][2];

    const req = { params: { id: '1' }, body: { title: 'Updated' } };
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.updateCase).toHaveBeenCalledWith(req, res);
  });

  it('should set up PATCH /:id/status route for updateCaseStatus', () => {
    expect(mockRouter.patch).toHaveBeenCalledWith(
      '/:id/status',
      ['validateUpdateStatus-mock'],
      expect.any(Function),
    );

    const routeHandler = mockRouter.patch.mock.calls[0][2];

    const req = { params: { id: '1' }, body: { status: 'COMPLETED' } };
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.updateCaseStatus).toHaveBeenCalledWith(req, res);
  });

  it('should set up DELETE /:id route for deleteCase', () => {
    expect(mockRouter.delete).toHaveBeenCalledWith(
      '/:id',
      ['validateDeleteCase-mock'],
      expect.any(Function),
    );

    const routeHandler = mockRouter.delete.mock.calls[0][2];

    const req = { params: { id: '1' } };
    const res = {};

    routeHandler(req, res);

    expect(mockCaseController.deleteCase).toHaveBeenCalledWith(req, res);
  });
});
