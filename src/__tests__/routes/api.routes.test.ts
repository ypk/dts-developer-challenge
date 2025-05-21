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

describe('Routes Index', () => {
  let routesModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    routesModule = await import('../../routes/api.routes.ts');
  });

  afterEach(() => {
    routesModule = null;
  });

  it('should set up case routes under /cases', () => {
    expect(mockRouter.use).toHaveBeenCalledWith('/cases', mockCaseRoutes);
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });
});
