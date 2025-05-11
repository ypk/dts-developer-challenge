import { Request, Response } from 'express';
import { CaseStatus } from '../../lib/prisma.ts';
import { ICaseService } from '../../interfaces/ICaseService.ts';
import { ICaseHelper } from '../../interfaces/ICaseHelper.ts';
import { IResponseHandler } from '../../interfaces/IResponseHandler.ts';
import { CaseControllerImpl } from '../../controllers/CaseControllerImpl.ts';

describe('CaseControllerImpl', () => {
  let mockService: jest.Mocked<ICaseService>;
  let mockCaseHelper: jest.Mocked<ICaseHelper>;
  let mockResponseHandler: jest.Mocked<IResponseHandler>;
  let controller: CaseControllerImpl;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const createMockCase = (overrides = {}) => ({
    id: 1,
    title: 'Test Case',
    description: 'Test Description',
    status: CaseStatus.PENDING,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    mockService = {
      getAllCases: jest.fn(),
      getAllCasesPaginated: jest.fn(),
      getCaseById: jest.fn(),
      createCase: jest.fn(),
      updateCase: jest.fn(),
      updateCaseStatus: jest.fn(),
      deleteCase: jest.fn(),
    } as jest.Mocked<ICaseService>;

    mockCaseHelper = {
      validateAndParseId: jest.fn(),
      handleNotFoundError: jest.fn(),
    } as jest.Mocked<ICaseHelper>;

    mockResponseHandler = {
      sendSuccess: jest.fn(),
      sendError: jest.fn(),
      sendBadRequest: jest.fn(),
      sendNoContent: jest.fn(),
    } as jest.Mocked<IResponseHandler>;

    controller = new CaseControllerImpl(mockService, mockCaseHelper, mockResponseHandler);

    mockRequest = {
      params: {},
      body: {},
      pagination: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getAllCases', () => {
    it('should return all cases without pagination', async () => {
      const mockCases = [createMockCase()];
      mockService.getAllCases.mockResolvedValue(mockCases);

      await controller.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllCases).toHaveBeenCalled();
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Cases retrieved successfully',
        count: mockCases.length,
        data: mockCases,
      });
    });

    it('should return paginated cases when pagination is provided', async () => {
      const mockPaginatedResult = {
        data: [createMockCase()],
        meta: {
          total: 10,
          page: 1,
          limit: 5,
          totalPages: 2,
        },
      };
      mockRequest.pagination = { page: 1, limit: 5, skip: 0 };
      mockService.getAllCasesPaginated.mockResolvedValue(mockPaginatedResult);

      await controller.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllCasesPaginated).toHaveBeenCalledWith(1, 5);
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Cases retrieved successfully',
        count: mockPaginatedResult.meta.total,
        data: mockPaginatedResult.data,
        pagination: mockPaginatedResult.meta,
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');
      mockService.getAllCases.mockRejectedValue(mockError);

      await controller.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to retrieve cases',
        mockError,
      );
    });
  });

  describe('getCaseById', () => {
    it('should return a case when valid ID is provided', async () => {
      const caseId = 1;
      const mockCase = createMockCase({ id: caseId });
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.getCaseById.mockResolvedValue(mockCase);

      await controller.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.getCaseById).toHaveBeenCalledWith(caseId);
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case retrieved successfully',
        data: mockCase,
      });
    });

    it('should handle invalid ID', async () => {
      mockCaseHelper.validateAndParseId.mockReturnValue(null);

      await controller.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.getCaseById).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      const caseId = 999;
      const mockError = new Error('Not found');
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.getCaseById.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(true);

      await controller.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.getCaseById).toHaveBeenCalledWith(caseId);
      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).not.toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      const caseId = 1;
      const mockError = new Error('Database error');
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.getCaseById.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(false);

      await controller.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to retrieve case',
        mockError,
      );
    });
  });

  describe('createCase', () => {
    it('should create a case with valid input', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Description',
        status: CaseStatus.PENDING,
        dueDate: '2023-12-31T23:59:59Z',
      };
      const createdCase = createMockCase({
        id: 1,
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        dueDate: new Date(caseData.dueDate),
      });

      mockRequest.body = caseData;
      mockService.createCase.mockResolvedValue(createdCase);

      await controller.createCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCase).toHaveBeenCalledWith({
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        dueDate: expect.any(Date),
      });
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        {
          message: 'Case created successfully',
          data: createdCase,
        },
        201,
      );
    });

    it('should handle missing title', async () => {
      mockRequest.body = {
        description: 'Description',
      };

      await controller.createCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCase).not.toHaveBeenCalled();
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Title is required',
      );
    });

    it('should set default status when not provided', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Description',
      };
      const createdCase = createMockCase({
        title: caseData.title,
        description: caseData.description,
        status: CaseStatus.PENDING,
      });

      mockRequest.body = caseData;
      mockService.createCase.mockResolvedValue(createdCase);

      await controller.createCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.createCase).toHaveBeenCalledWith({
        title: caseData.title,
        description: caseData.description,
        status: CaseStatus.PENDING,
        dueDate: undefined,
      });
    });

    it('should handle service errors', async () => {
      const mockError = new Error('Database error');
      mockRequest.body = {
        title: 'New Case',
      };
      mockService.createCase.mockRejectedValue(mockError);

      await controller.createCase(mockRequest as Request, mockResponse as Response);

      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create case',
        mockError,
      );
    });
  });

  describe('updateCase', () => {
    it('should update a case with valid input', async () => {
      const caseId = 1;
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const updatedCase = createMockCase({
        id: caseId,
        ...updateData,
      });

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockResolvedValue(updatedCase);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.updateCase).toHaveBeenCalledWith(caseId, updateData);
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case updated successfully',
        data: updatedCase,
      });
    });

    it('should handle invalid ID', async () => {
      mockCaseHelper.validateAndParseId.mockReturnValue(null);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).not.toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      const caseId = 1;
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = {};
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).not.toHaveBeenCalled();
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Request body is required',
      );
    });

    it('should handle not found error', async () => {
      const caseId = 999;
      const updateData = { title: 'Updated Title' };
      const mockError = new Error('Not found');
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(true);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).not.toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      const caseId = 1;
      const updateData = { title: 'Updated Title' };
      const mockError = new Error('Database error');
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(false);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update case',
        mockError,
      );
    });

    it('should process dueDate correctly', async () => {
      const caseId = 1;
      const updateData = {
        title: 'Updated Title',
        dueDate: '2023-12-31T23:59:59Z',
      };
      const updatedCase = createMockCase({
        id: caseId,
        title: updateData.title,
        dueDate: new Date(updateData.dueDate),
      });

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockResolvedValue(updatedCase);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).toHaveBeenCalledWith(caseId, {
        title: updateData.title,
        dueDate: expect.any(Date),
      });
    });

    it('should explicitly convert dueDate string to Date object when updating', async () => {
      const caseId = 1;
      const dueDateString = '2023-12-31T23:59:59Z';
      const updateData = {
        dueDate: dueDateString,
      };

      const expectedDate = new Date(dueDateString);

      const updatedCase = createMockCase({
        id: caseId,
        dueDate: expectedDate,
      });

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockResolvedValue(updatedCase);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).toHaveBeenCalledWith(caseId, { dueDate: expect.any(Date) });

      const updateCallArgs = mockService.updateCase.mock.calls[0][1];

      expect(updateCallArgs).toHaveProperty('dueDate');

      const dueDate = updateCallArgs.dueDate;

      expect(dueDate instanceof Date).toBe(true);

      expect((dueDate as Date).getTime()).toBe(expectedDate.getTime());

      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case updated successfully',
        data: updatedCase,
      });
    });

    it('should include status field when updating a case', async () => {
      const caseId = 1;
      const updateData = {
        status: CaseStatus.COMPLETED,
      };

      const updatedCase = createMockCase({
        id: caseId,
        status: CaseStatus.COMPLETED,
      });

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCase.mockResolvedValue(updatedCase);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).toHaveBeenCalledWith(caseId, { status: CaseStatus.COMPLETED });

      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case updated successfully',
        data: updatedCase,
      });
    });

    it('should handle null or undefined request body', async () => {
      const caseId = 1;
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = null;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCase).not.toHaveBeenCalled();
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Request body is required',
      );
    });

    it('should handle and rethrow errors from the service', async () => {
      const caseId = 1;
      const updateData = { title: 'Updated Title' };
      const mockError = new Error('Service error');

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = updateData;
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);

      mockService.updateCase.mockRejectedValue(mockError);

      mockCaseHelper.handleNotFoundError.mockReturnValue(false);

      await controller.updateCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);

      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update case',
        mockError,
      );
    });
  });

  describe('updateCaseStatus', () => {
    it('should update case status with valid input', async () => {
      const caseId = 1;
      const newStatus = CaseStatus.IN_PROGRESS;
      const updatedCase = createMockCase({
        id: caseId,
        status: newStatus,
      });

      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = { status: newStatus };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCaseStatus.mockResolvedValue(updatedCase);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.updateCaseStatus).toHaveBeenCalledWith(caseId, newStatus);
      expect(mockResponseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case status updated successfully',
        data: updatedCase,
      });
    });

    it('should handle invalid ID', async () => {
      mockCaseHelper.validateAndParseId.mockReturnValue(null);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCaseStatus).not.toHaveBeenCalled();
    });

    it('should handle missing status', async () => {
      const caseId = 1;
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = {};
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCaseStatus).not.toHaveBeenCalled();
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Status is required',
      );
    });

    it('should handle invalid status value', async () => {
      const caseId = 1;
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = { status: 'INVALID_STATUS' };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateCaseStatus).not.toHaveBeenCalled();
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        `Invalid status. Must be one of: ${Object.values(CaseStatus).join(', ')}`,
      );
    });

    it('should handle not found error', async () => {
      const caseId = 999;
      const mockError = new Error('Not found');
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = { status: CaseStatus.COMPLETED };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCaseStatus.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(true);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).not.toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      const caseId = 1;
      const mockError = new Error('Database error');
      mockRequest.params = { id: caseId.toString() };
      mockRequest.body = { status: CaseStatus.COMPLETED };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.updateCaseStatus.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(false);

      await controller.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update case status',
        mockError,
      );
    });
  });

  describe('deleteCase', () => {
    it('should delete a case with valid ID', async () => {
      const caseId = 1;
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.deleteCase.mockResolvedValue(undefined);

      await controller.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockService.deleteCase).toHaveBeenCalledWith(caseId);
      expect(mockResponseHandler.sendNoContent).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle invalid ID', async () => {
      mockCaseHelper.validateAndParseId.mockReturnValue(null);

      await controller.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(mockService.deleteCase).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      const caseId = 999;
      const mockError = new Error('Not found');
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.deleteCase.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(true);

      await controller.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).not.toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      const caseId = 1;
      const mockError = new Error('Database error');
      mockRequest.params = { id: caseId.toString() };
      mockCaseHelper.validateAndParseId.mockReturnValue(caseId);
      mockService.deleteCase.mockRejectedValue(mockError);
      mockCaseHelper.handleNotFoundError.mockReturnValue(false);

      await controller.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(mockCaseHelper.handleNotFoundError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(mockResponseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to delete case',
        mockError,
      );
    });
  });
});
