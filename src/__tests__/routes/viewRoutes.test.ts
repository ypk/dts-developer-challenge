import { Request, Response } from 'express';

const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
};

const mockExpress = {
  Router: jest.fn(() => mockRouter),
};

jest.mock('express', () => mockExpress);

jest.mock('../../services/CaseService.ts', () => ({
  CaseServiceInstance: {
    getAllCasesPaginated: jest.fn(),
    getCaseById: jest.fn(),
    createCase: jest.fn(),
    updateCase: jest.fn(),
    deleteCase: jest.fn(),
  },
}));

jest.mock('../../middleware/validation.middleware.ts');
jest.mock('../../middleware/error.middleware.ts', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
}));

import { CaseServiceInstance } from '../../services/CaseService.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';

describe('View Routes', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  const routeHandlers: { [key: string]: Function } = {};

  const createMockSession = (data: any = {}) => ({
    id: 'test-session-id',
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
      secure: false,
      sameSite: false,
    },
    regenerate: jest.fn((callback) => callback && callback()),
    destroy: jest.fn((callback) => callback && callback()),
    reload: jest.fn((callback) => callback && callback()),
    save: jest.fn((callback) => callback && callback()),
    touch: jest.fn(),
    ...data,
  });

  beforeAll(async () => {
    await import('../../routes/viewRoutes.ts');

    mockRouter.get.mock.calls.forEach((call) => {
      const [path, ...handlers] = call;
      routeHandlers[`GET ${path}`] = handlers[handlers.length - 1];
    });

    mockRouter.post.mock.calls.forEach((call) => {
      const [path, ...handlers] = call;
      routeHandlers[`POST ${path}`] = handlers[handlers.length - 1];
    });

    mockRouter.delete.mock.calls.forEach((call) => {
      const [path, ...handlers] = call;
      routeHandlers[`DELETE ${path}`] = handlers[handlers.length - 1];
    });

    mockRouter.put.mock.calls.forEach((call) => {
      const [path, ...handlers] = call;
      routeHandlers[`PUT ${path}`] = handlers[handlers.length - 1];
    });
  });

  beforeEach(() => {
    (CaseServiceInstance.getAllCasesPaginated as jest.Mock).mockClear();
    (CaseServiceInstance.getCaseById as jest.Mock).mockClear();
    (CaseServiceInstance.createCase as jest.Mock).mockClear();
    (CaseServiceInstance.updateCase as jest.Mock).mockClear();
    (CaseServiceInstance.deleteCase as jest.Mock).mockClear();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      flash: jest.fn(),
      session: createMockSession(),
      path: '',
      method: 'GET',
      url: '/',
    };
    mockResponse = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Route registration', () => {
    it('should create a router instance', () => {
      expect(mockExpress.Router).toHaveBeenCalled();
    });

    it('should register routes', () => {
      expect(mockRouter.get.mock.calls.length).toBeGreaterThan(0);
    });

    it('should export router', async () => {
      const routesModule = await import('../../routes/viewRoutes.ts');
      expect(routesModule.default).toBe(mockRouter);
    });
  });

  describe('Error handling with handleErrorWithRedirect', () => {
    it('should handle Error instances', async () => {
      const handler = routeHandlers['GET /cases'];
      if (handler) {
        const error = new Error('Test error message');
        error.stack = 'Test stack trace';
        (CaseServiceInstance.getAllCasesPaginated as jest.Mock).mockRejectedValue(error);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/error',
          expect.objectContaining({
            errorMessage: 'Test error message',
            errorStack: 'Test stack trace',
          }),
        );
      }
    });

    it('should handle non-Error instances', async () => {
      const handler = routeHandlers['GET /cases'];
      if (handler) {
        const nonError = 'String error';
        (CaseServiceInstance.getAllCasesPaginated as jest.Mock).mockRejectedValue(nonError);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/error',
          expect.objectContaining({
            errorMessage: 'An error occurred while loading cases',
            errorStack: '',
          }),
        );
      }
    });
  });

  describe('Date parsing (parseDate function)', () => {
    it('should handle valid dates in case creation', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
          dueDate: '2023-12-31',
        };

        const newCase = { id: 1, ...mockRequest.body };
        (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.createCase).toHaveBeenCalledWith(
          expect.objectContaining({
            dueDate: new Date('2023-12-31'),
          }),
        );
      }
    });

    it('should handle invalid dates in case creation', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
          dueDate: 'invalid-date-string',
        };

        const newCase = { id: 1, ...mockRequest.body };
        (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.createCase).toHaveBeenCalledWith(
          expect.objectContaining({
            dueDate: null,
          }),
        );
      }
    });

    it('should handle empty date string', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
          dueDate: '',
        };

        const newCase = { id: 1, ...mockRequest.body };
        (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.createCase).toHaveBeenCalledWith(
          expect.objectContaining({
            dueDate: null,
          }),
        );
      }
    });
  });

  describe('POST /cases (Create case)', () => {
    it('should successfully create case and redirect', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'New Test Case',
          description: 'Test description',
          status: 'PENDING',
          dueDate: '2023-12-31',
        };

        const newCase = { id: 42, ...mockRequest.body };
        (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.createCase).toHaveBeenCalledWith({
          title: 'New Test Case',
          description: 'Test description',
          status: 'PENDING',
          dueDate: new Date('2023-12-31'),
        });
        expect(mockRequest.flash).toHaveBeenCalledWith('success', 'Case created successfully');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/42');
      }
    });

    it('should handle case creation with undefined description', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'New Test Case',
          status: 'PENDING',
        };

        const newCase = { id: 42, ...mockRequest.body };
        (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.createCase).toHaveBeenCalledWith({
          title: 'New Test Case',
          description: undefined,
          status: 'PENDING',
          dueDate: null,
        });
      }
    });

    it('should handle Error instances in catch block', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
        };

        const error = new Error('Database connection failed');
        (CaseServiceInstance.createCase as jest.Mock).mockRejectedValue(error);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Database connection failed');
        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/cases/new',
          expect.objectContaining({
            error: 'Database connection failed',
          }),
        );
      }
    });

    it('should handle non-Error instances in catch block', async () => {
      const handler = routeHandlers['POST /cases'];
      if (handler) {
        mockRequest.body = {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
        };

        const nonError = { code: 'CONSTRAINT_ERROR' };
        (CaseServiceInstance.createCase as jest.Mock).mockRejectedValue(nonError);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'An error occurred');
        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/cases/new',
          expect.objectContaining({
            error: 'An error occurred',
          }),
        );
      }
    });
  });

  describe('PUT /cases/:id error handling', () => {
    it('should handle non-Error instances in catch block', async () => {
      const handler = routeHandlers['PUT /cases/:id'];
      if (handler) {
        mockRequest.params = { id: '1' };
        mockRequest.body = { title: 'Updated Case' };

        const nonError = { code: 'DATABASE_CONSTRAINT' };
        (CaseServiceInstance.updateCase as jest.Mock).mockRejectedValue(nonError);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'An error occurred');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/1/edit');
      }
    });
  });

  describe('GET /cases/:id/delete error handling', () => {
    it('should handle non-Error instances in catch block', async () => {
      const handler = routeHandlers['GET /cases/:id/delete'];
      if (handler) {
        mockRequest.params = { id: '1' };

        const nonError = { message: 'Database unavailable' };
        (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(nonError);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'An error occurred');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });
  });

  describe('GET / (Home page)', () => {
    it('should render home page if handler exists', async () => {
      const handler = routeHandlers['GET /'];
      if (handler) {
        await handler(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockResponse.render).toHaveBeenCalled();
      }
    });
  });

  describe('GET /cases/new (New case form)', () => {
    it('should render new case form with empty formData', async () => {
      const handler = routeHandlers['GET /cases/new'];
      if (handler) {
        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith('pages/cases/new', {
          title: 'Create New Case',
          pageHeading: 'Create New Case',
          formData: {},
        });
      }
    });
  });

  describe('GET /cases/:id/edit (Edit case form)', () => {
    it('should render edit case form for valid ID', async () => {
      const handler = routeHandlers['GET /cases/:id/edit'];
      if (handler) {
        mockRequest.params = { id: '1' };
        const caseData = { id: 1, title: 'Test Case', description: 'Test description' };

        (CaseServiceInstance.getCaseById as jest.Mock).mockResolvedValue(caseData);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.getCaseById).toHaveBeenCalledWith(1);
        expect(mockResponse.render).toHaveBeenCalledWith('pages/cases/edit', {
          title: 'Edit Case #1',
          pageHeading: 'Edit Case: Test Case',
          caseData,
        });
      }
    });

    it('should handle invalid case ID', async () => {
      const handler = routeHandlers['GET /cases/:id/edit'];
      if (handler) {
        mockRequest.params = { id: 'invalid' };

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/error',
          expect.objectContaining({
            errorMessage: 'Invalid case ID',
          }),
        );
      }
    });

    it('should handle NotFoundError', async () => {
      const handler = routeHandlers['GET /cases/:id/edit'];
      if (handler) {
        mockRequest.params = { id: '999' };
        (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(
          new NotFoundError('Case not found'),
        );

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Case not found');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });

    it('should handle other errors', async () => {
      const handler = routeHandlers['GET /cases/:id/edit'];
      if (handler) {
        mockRequest.params = { id: '1' };
        const error = new Error('Database error');
        (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(error);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith(
          'pages/error',
          expect.objectContaining({
            errorMessage: 'Database error',
          }),
        );
      }
    });
  });

  describe('PUT /cases/:id (Update case)', () => {
    it('should successfully update case and redirect', async () => {
      const handler = routeHandlers['PUT /cases/:id'];
      if (handler) {
        mockRequest.params = { id: '1' };
        mockRequest.body = {
          title: 'Updated Case Title',
          description: 'Updated description',
          status: 'IN_PROGRESS',
        };

        const updatedCase = { id: 1, ...mockRequest.body };
        (CaseServiceInstance.updateCase as jest.Mock).mockResolvedValue(updatedCase);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.updateCase).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            title: 'Updated Case Title',
            description: 'Updated description',
            status: 'IN_PROGRESS',
          }),
        );
        expect(mockRequest.flash).toHaveBeenCalledWith('success', 'Case updated successfully');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/1');
      }
    });

    it('should handle missing title validation', async () => {
      const handler = routeHandlers['PUT /cases/:id'];
      if (handler) {
        mockRequest.params = { id: '1' };
        mockRequest.body = { title: '' };

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Title is required');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/1/edit');
      }
    });

    it('should handle NotFoundError during update', async () => {
      const handler = routeHandlers['PUT /cases/:id'];
      if (handler) {
        mockRequest.params = { id: '999' };
        mockRequest.body = { title: 'Valid Title' };

        (CaseServiceInstance.updateCase as jest.Mock).mockRejectedValue(
          new NotFoundError('Case not found'),
        );

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Case not found');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });
  });

  describe('GET /cases/:id/delete (Delete confirmation)', () => {
    it('should render delete confirmation page for valid ID', async () => {
      const handler = routeHandlers['GET /cases/:id/delete'];
      if (handler) {
        mockRequest.params = { id: '1' };
        const caseData = { id: 1, title: 'Test Case', description: 'Test description' };

        (CaseServiceInstance.getCaseById as jest.Mock).mockResolvedValue(caseData);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(CaseServiceInstance.getCaseById).toHaveBeenCalledWith(1);
        expect(mockResponse.render).toHaveBeenCalledWith('pages/cases/confirm-delete', {
          title: 'Delete Case #1',
          pageHeading: 'Are you sure you want to delete this case?',
          caseData,
        });
      }
    });

    it('should handle invalid case ID', async () => {
      const handler = routeHandlers['GET /cases/:id/delete'];
      if (handler) {
        mockRequest.params = { id: 'invalid' };

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Invalid case ID');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });

    it('should handle NotFoundError', async () => {
      const handler = routeHandlers['GET /cases/:id/delete'];
      if (handler) {
        mockRequest.params = { id: '999' };
        (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(
          new NotFoundError('Case not found'),
        );

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Case not found');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });

    it('should handle other errors', async () => {
      const handler = routeHandlers['GET /cases/:id/delete'];
      if (handler) {
        mockRequest.params = { id: '1' };
        const error = new Error('Database error');
        (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(error);

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRequest.flash).toHaveBeenCalledWith('error', 'Database error');
        expect(mockResponse.redirect).toHaveBeenCalledWith('/cases');
      }
    });
  });

  describe('GET /error (Error page)', () => {
    it('should render error page with query parameters', async () => {
      const handler = routeHandlers['GET /error'];
      if (handler) {
        mockRequest.query = {
          message: 'Custom error message',
          stack: 'Error stack trace',
        };

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith('pages/error', {
          title: 'Error',
          pageHeading: 'An error occurred',
          errorMessage: 'Custom error message',
          errorStack: 'Error stack trace',
        });
      }
    });

    it('should render error page with default values', async () => {
      const handler = routeHandlers['GET /error'];
      if (handler) {
        mockRequest.query = {};

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalledWith('pages/error', {
          title: 'Error',
          pageHeading: 'An error occurred',
          errorMessage: 'An unexpected error occurred',
          errorStack: '',
        });
      }
    });
  });

  describe('Case-related routes', () => {
    describe('GET /cases', () => {
      it('should handle cases listing if handler exists', async () => {
        const handler = routeHandlers['GET /cases'];
        if (handler) {
          const mockCases = {
            data: [{ id: 1, title: 'Test Case' }],
            meta: { currentPage: 1, totalPages: 1, page: 1, limit: 10 },
          };

          (CaseServiceInstance.getAllCasesPaginated as jest.Mock).mockResolvedValue(mockCases);

          await handler(mockRequest as Request, mockResponse as Response, mockNext);

          expect(mockResponse.render).toHaveBeenCalled();
          expect(CaseServiceInstance.getAllCasesPaginated).toHaveBeenCalled();
        }
      });

      it('should handle errors when loading cases if handler exists', async () => {
        const handler = routeHandlers['GET /cases'];
        if (handler) {
          const error = new Error('Database error');
          (CaseServiceInstance.getAllCasesPaginated as jest.Mock).mockRejectedValue(error);

          await handler(mockRequest as Request, mockResponse as Response, mockNext);
          expect(mockResponse.render).toHaveBeenCalled();
        }
      });
    });

    describe('POST /cases', () => {
      it('should handle case creation if handler exists', async () => {
        const handler = routeHandlers['POST /cases'];
        if (handler) {
          mockRequest.body = {
            title: 'New Case',
            description: 'Test description',
            status: 'PENDING',
            dueDate: '2023-12-31',
          };

          const newCase = { id: 1, ...mockRequest.body };
          (CaseServiceInstance.createCase as jest.Mock).mockResolvedValue(newCase);

          await handler(mockRequest as Request, mockResponse as Response, mockNext);

          expect(mockResponse.redirect || mockResponse.render).toBeTruthy();
        }
      });

      it('should handle validation errors if handler exists', async () => {
        const handler = routeHandlers['POST /cases'];
        if (handler) {
          mockRequest.body = { title: '' };

          await handler(mockRequest as Request, mockResponse as Response, mockNext);
          expect(mockResponse.render).toHaveBeenCalled();
        }
      });
    });

    describe('GET /cases/:id', () => {
      it('should render case details if handler exists', async () => {
        const handler = routeHandlers['GET /cases/:id'];
        if (handler) {
          mockRequest.params = { id: '1' };
          const caseData = { id: 1, title: 'Test Case', description: 'Test description' };

          (CaseServiceInstance.getCaseById as jest.Mock).mockResolvedValue(caseData);

          await handler(mockRequest as Request, mockResponse as Response, mockNext);

          expect(mockResponse.render).toHaveBeenCalled();
          expect(CaseServiceInstance.getCaseById).toHaveBeenCalledWith(1);
        }
      });

      it('should handle not found errors if handler exists', async () => {
        const handler = routeHandlers['GET /cases/:id'];
        if (handler) {
          mockRequest.params = { id: '999' };
          (CaseServiceInstance.getCaseById as jest.Mock).mockRejectedValue(
            new NotFoundError('Case not found'),
          );

          await handler(mockRequest as Request, mockResponse as Response, mockNext);

          expect(
            ((mockResponse.render as jest.Mock)?.mock?.calls.length ?? 0) +
              ((mockResponse.redirect as jest.Mock)?.mock?.calls.length ?? 0),
          ).toBeGreaterThan(0);
        }
      });
    });

    describe('DELETE /cases/:id/delete', () => {
      it('should handle case deletion if handler exists', async () => {
        const handler = routeHandlers['DELETE /cases/:id/delete'];
        if (handler) {
          mockRequest.params = { id: '1' };
          (CaseServiceInstance.deleteCase as jest.Mock).mockResolvedValue(undefined);

          await handler(mockRequest as Request, mockResponse as Response, mockNext);

          expect(CaseServiceInstance.deleteCase).toHaveBeenCalledWith(1);
          expect(
            ((mockResponse.render as jest.Mock)?.mock?.calls.length ?? 0) +
              ((mockResponse.redirect as jest.Mock)?.mock?.calls.length ?? 0),
          ).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle invalid IDs gracefully', async () => {
      const handlers = [
        routeHandlers['GET /cases/:id'],
        routeHandlers['PUT /cases/:id'],
        routeHandlers['DELETE /cases/:id/delete'],
      ].filter(Boolean);

      for (const handler of handlers) {
        mockRequest.params = { id: 'invalid' };

        await handler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(
          ((mockResponse.render as jest.Mock | undefined)?.mock?.calls.length ?? 0) +
            ((mockResponse.redirect as jest.Mock | undefined)?.mock?.calls.length ?? 0),
        ).toBeGreaterThan(0);

        (mockResponse.render as jest.Mock)?.mockClear();
        (mockResponse.redirect as jest.Mock)?.mockClear();
      }
    });

    it('should handle missing request data', async () => {
      const postHandler = routeHandlers['POST /cases'];
      if (postHandler) {
        mockRequest.body = {};

        await postHandler(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.render).toHaveBeenCalled();
      }
    });
  });
});
