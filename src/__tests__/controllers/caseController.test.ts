import { Request, Response } from 'express';
import { CaseStatus } from '../../lib/prisma.ts';
import { caseController } from '../../controllers/caseController.ts';
import { caseService } from '../../services/caseService.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';
import * as responseHandler from '../../utils/responseHandler.ts';
import * as caseHelper from '../../utils/caseHelper.ts';

jest.mock('../../services/caseService.ts');
jest.mock('../../utils/responseHandler.ts');
jest.mock('../../utils/caseHelper.ts');

describe('Case Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    (responseHandler.sendSuccess as jest.Mock).mockImplementation(() => undefined);
    (responseHandler.sendError as jest.Mock).mockImplementation(() => undefined);
    (responseHandler.sendBadRequest as jest.Mock).mockImplementation(() => undefined);
    (responseHandler.sendNoContent as jest.Mock).mockImplementation(() => undefined);
  });

  describe('getAllCases', () => {
    it('should get all cases without pagination when pagination is not provided', async () => {
      const mockCases = [
        { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
        { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
      ];

      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      await caseController.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(caseService.getAllCases).toHaveBeenCalledTimes(1);
      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Cases retrieved successfully',
        count: mockCases.length,
        data: mockCases,
      });
    });

    it('should use pagination when pagination object is available', async () => {
      const mockPaginatedResult = {
        data: [
          { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
          { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
        ],
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      };

      mockRequest.pagination = {
        page: 1,
        limit: 10,
        skip: 0,
      };

      (caseService.getAllCasesPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      await caseController.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(caseService.getAllCasesPaginated).toHaveBeenCalledTimes(1);
      expect(caseService.getAllCasesPaginated).toHaveBeenCalledWith(1, 10);
      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Cases retrieved successfully',
        count: mockPaginatedResult.meta.total,
        data: mockPaginatedResult.data,
        pagination: mockPaginatedResult.meta,
      });
    });

    it('should handle errors and send error response', async () => {
      const error = new Error('Database error');
      (caseService.getAllCases as jest.Mock).mockRejectedValue(error);

      await caseController.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(caseService.getAllCases).toHaveBeenCalledTimes(1);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to retrieve cases',
        error,
      );
    });

    it('should handle errors with pagination and send error response', async () => {
      const error = new Error('Database error');
      mockRequest.pagination = {
        page: 2,
        limit: 15,
        skip: 15,
      };

      (caseService.getAllCasesPaginated as jest.Mock).mockRejectedValue(error);

      await caseController.getAllCases(mockRequest as Request, mockResponse as Response);

      expect(caseService.getAllCasesPaginated).toHaveBeenCalledTimes(1);
      expect(caseService.getAllCasesPaginated).toHaveBeenCalledWith(2, 15);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to retrieve cases',
        error,
      );
    });
  });

  describe('getCaseById', () => {
    it('should get case by id and send success response', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };
      mockRequest.params = { id: '1' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.getCaseById as jest.Mock).mockResolvedValue(mockCase);

      await caseController.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.getCaseById).toHaveBeenCalledWith(1);
      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case retrieved successfully',
        data: mockCase,
      });
    });

    it('should handle invalid id and return early', async () => {
      mockRequest.params = { id: 'invalid' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(null);

      await caseController.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.getCaseById).not.toHaveBeenCalled();
      expect(responseHandler.sendSuccess).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };
      const error = new NotFoundError('Case with ID 999 not found');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(999);
      (caseService.getCaseById as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(true);

      await caseController.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.getCaseById).toHaveBeenCalledWith(999);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendSuccess).not.toHaveBeenCalled();
    });

    it('should handle other errors and send error response', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.getCaseById as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(false);

      await caseController.getCaseById(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.getCaseById).toHaveBeenCalledWith(1);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to retrieve case',
        error,
      );
    });
  });

  describe('createCase', () => {
    it('should create a case and send success response', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Test description',
        status: CaseStatus.PENDING,
        dueDate: '2023-12-31',
      };

      const mockCreatedCase = {
        id: 1,
        ...caseData,
        dueDate: new Date(caseData.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = caseData;

      (caseService.createCase as jest.Mock).mockResolvedValue(mockCreatedCase);

      await caseController.createCase(mockRequest as Request, mockResponse as Response);

      expect(caseService.createCase).toHaveBeenCalledWith({
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        dueDate: new Date(caseData.dueDate),
      });

      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        {
          message: 'Case created successfully',
          data: mockCreatedCase,
        },
        201,
      );
    });

    it('should use default status when not provided', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Test description',
      };

      const mockCreatedCase = {
        id: 1,
        ...caseData,
        status: CaseStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = caseData;

      (caseService.createCase as jest.Mock).mockResolvedValue(mockCreatedCase);

      await caseController.createCase(mockRequest as Request, mockResponse as Response);

      expect(caseService.createCase).toHaveBeenCalledWith({
        title: caseData.title,
        description: caseData.description,
        status: CaseStatus.PENDING,
      });
    });

    it('should send bad request when title is missing', async () => {
      mockRequest.body = {
        description: 'Test description',
      };

      await caseController.createCase(mockRequest as Request, mockResponse as Response);

      expect(caseService.createCase).not.toHaveBeenCalled();
      expect(responseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Title is required',
      );
    });

    it('should handle errors and send error response', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Test description',
      };

      const error = new Error('Database error');

      mockRequest.body = caseData;

      (caseService.createCase as jest.Mock).mockRejectedValue(error);

      await caseController.createCase(mockRequest as Request, mockResponse as Response);

      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create case',
        error,
      );
    });
  });

  describe('updateCase', () => {
    it('should update a case and send success response', async () => {
      const updateData = {
        title: 'Updated Case',
        description: 'Updated description',
        status: CaseStatus.IN_PROGRESS,
        dueDate: '2023-12-31',
      };

      const mockUpdatedCase = {
        id: 1,
        ...updateData,
        dueDate: new Date(updateData.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.updateCase as jest.Mock).mockResolvedValue(mockUpdatedCase);

      await caseController.updateCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCase).toHaveBeenCalledWith(1, {
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        dueDate: new Date(updateData.dueDate),
      });

      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case updated successfully',
        data: mockUpdatedCase,
      });
    });

    it('should handle invalid id and return early', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { title: 'Updated Case' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(null);

      await caseController.updateCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCase).not.toHaveBeenCalled();
    });

    it('should send bad request when body is empty', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);

      await caseController.updateCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCase).not.toHaveBeenCalled();
      expect(responseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Request body is required',
      );
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { title: 'Updated Case' };

      const error = new NotFoundError('Case with ID 999 not found');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(999);
      (caseService.updateCase as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(true);

      await caseController.updateCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCase).toHaveBeenCalledWith(999, { title: 'Updated Case' });
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
    });

    it('should handle other errors and send error response', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { title: 'Updated Case' };

      const error = new Error('Database error');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.updateCase as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(false);

      await caseController.updateCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCase).toHaveBeenCalledWith(1, { title: 'Updated Case' });
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update case',
        error,
      );
    });
  });

  describe('updateCaseStatus', () => {
    it('should update case status and send success response', async () => {
      const newStatus = CaseStatus.COMPLETED;

      const mockUpdatedCase = {
        id: 1,
        title: 'Case 1',
        status: newStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { status: newStatus };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.updateCaseStatus as jest.Mock).mockResolvedValue(mockUpdatedCase);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).toHaveBeenCalledWith(1, newStatus);
      expect(responseHandler.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        message: 'Case status updated successfully',
        data: mockUpdatedCase,
      });
    });

    it('should handle invalid id and return early', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { status: CaseStatus.COMPLETED };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(null);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).not.toHaveBeenCalled();
    });

    it('should send bad request when status is missing', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).not.toHaveBeenCalled();
      expect(responseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Status is required',
      );
    });

    it('should send bad request when status is invalid', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'INVALID_STATUS' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).not.toHaveBeenCalled();
      expect(responseHandler.sendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        `Invalid status. Must be one of: ${Object.values(CaseStatus).join(', ')}`,
      );
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: CaseStatus.COMPLETED };

      const error = new NotFoundError('Case with ID 999 not found');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(999);
      (caseService.updateCaseStatus as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(true);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).toHaveBeenCalledWith(999, CaseStatus.COMPLETED);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
    });

    it('should handle other errors and send error response', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: CaseStatus.COMPLETED };

      const error = new Error('Database error');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.updateCaseStatus as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(false);

      await caseController.updateCaseStatus(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.updateCaseStatus).toHaveBeenCalledWith(1, CaseStatus.COMPLETED);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update case status',
        error,
      );
    });
  });

  describe('deleteCase', () => {
    it('should delete case and send no content response', async () => {
      mockRequest.params = { id: '1' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.deleteCase as jest.Mock).mockResolvedValue(undefined);

      await caseController.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.deleteCase).toHaveBeenCalledWith(1);
      expect(responseHandler.sendNoContent).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle invalid id and return early', async () => {
      mockRequest.params = { id: 'invalid' };

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(null);

      await caseController.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.deleteCase).not.toHaveBeenCalled();
      expect(responseHandler.sendNoContent).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };

      const error = new NotFoundError('Case with ID 999 not found');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(999);
      (caseService.deleteCase as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(true);

      await caseController.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.deleteCase).toHaveBeenCalledWith(999);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendNoContent).not.toHaveBeenCalled();
    });

    it('should handle other errors and send error response', async () => {
      mockRequest.params = { id: '1' };

      const error = new Error('Database error');

      (caseHelper.validateAndParseId as jest.Mock).mockReturnValue(1);
      (caseService.deleteCase as jest.Mock).mockRejectedValue(error);
      (caseHelper.handleNotFoundError as jest.Mock).mockReturnValue(false);

      await caseController.deleteCase(mockRequest as Request, mockResponse as Response);

      expect(caseHelper.validateAndParseId).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(caseService.deleteCase).toHaveBeenCalledWith(1);
      expect(caseHelper.handleNotFoundError).toHaveBeenCalledWith(error, mockResponse);
      expect(responseHandler.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to delete case',
        error,
      );
    });
  });
});
