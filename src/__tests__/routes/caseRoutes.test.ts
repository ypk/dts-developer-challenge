 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

import { caseController } from '../../controllers/caseController.ts';

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
    expect(mockRouter.get).toHaveBeenCalledWith('/', caseController.getAllCases);
  });

  it('should set up GET /:id route for getCaseById', () => {
    expect(mockRouter.get).toHaveBeenCalledWith('/:id', caseController.getCaseById);
  });

  it('should set up POST / route for createCase', () => {
    expect(mockRouter.post).toHaveBeenCalledWith('/', caseController.createCase);
  });

  it('should set up PUT /:id route for updateCase', () => {
    expect(mockRouter.put).toHaveBeenCalledWith('/:id', caseController.updateCase);
  });

  it('should set up PATCH /:id/status route for updateCaseStatus', () => {
    expect(mockRouter.patch).toHaveBeenCalledWith('/:id/status', caseController.updateCaseStatus);
  });

  it('should set up DELETE /:id route for deleteCase', () => {
    expect(mockRouter.delete).toHaveBeenCalledWith('/:id', caseController.deleteCase);
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });
});
