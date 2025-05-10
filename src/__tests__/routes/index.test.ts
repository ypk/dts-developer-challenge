const mockRouter = {
  use: jest.fn(),
};

jest.mock('express', () => ({
  Router: jest.fn(() => mockRouter),
}));

jest.mock('../../routes/caseRoutes.ts', () => 'caseRoutes-mock');

describe('Index Routes', () => {
  let routesModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    routesModule = await import('../../routes/index.ts');
  });

  afterEach(() => {
    routesModule = null;
  });

  it('should set up /cases route with caseRoutes', () => {
    expect(mockRouter.use).toHaveBeenCalledWith('/cases', 'caseRoutes-mock');
  });

  it('should export the router', () => {
    expect(routesModule.default).toBe(mockRouter);
  });
});
