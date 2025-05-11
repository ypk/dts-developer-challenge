import { Case, CaseStatus, Prisma } from '../../lib/prisma.ts';
import { ICaseRepository, PaginatedResult } from '../../interfaces/ICaseRepository.ts';
import { CaseService } from '../../services/CaseService.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';

describe('CaseService', () => {
  let mockRepository: jest.Mocked<ICaseRepository>;
  let service: CaseService;

  const createMockCase = (id: number = 1): Case => ({
    id,
    title: `Test Case ${id}`,
    description: `Description for test case ${id}`,
    status: CaseStatus.PENDING,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICaseRepository>;

    service = new CaseService(mockRepository);
  });

  describe('getAllCases', () => {
    it('should return all cases from the repository', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      mockRepository.findAll.mockResolvedValue(mockCases);

      const result = await service.getAllCases();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCases);
    });

    it('should propagate errors from the repository', async () => {
      const mockError = new Error('Repository error');
      mockRepository.findAll.mockRejectedValue(mockError);

      await expect(service.getAllCases()).rejects.toThrow(mockError);
    });
  });

  describe('getAllCasesPaginated', () => {
    it('should return paginated cases from the repository', async () => {
      const mockPaginatedResult: PaginatedResult<Case> = {
        data: [createMockCase(1), createMockCase(2)],
        meta: {
          total: 10,
          page: 2,
          limit: 5,
          totalPages: 2,
        },
      };
      mockRepository.findAllPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllCasesPaginated(2, 5);

      expect(mockRepository.findAllPaginated).toHaveBeenCalledWith(5, 5); // skip = (page-1)*limit
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should use default pagination parameters when not provided', async () => {
      const mockPaginatedResult: PaginatedResult<Case> = {
        data: [createMockCase(1), createMockCase(2)],
        meta: {
          total: 20,
          page: 1,
          limit: 10,
          totalPages: 2,
        },
      };
      mockRepository.findAllPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllCasesPaginated();

      expect(mockRepository.findAllPaginated).toHaveBeenCalledWith(0, 10); // Default: page 1, limit 10
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should propagate errors from the repository', async () => {
      const mockError = new Error('Repository error');
      mockRepository.findAllPaginated.mockRejectedValue(mockError);

      await expect(service.getAllCasesPaginated(1, 10)).rejects.toThrow(mockError);
    });
  });

  describe('getCaseById', () => {
    it('should return a case when it exists', async () => {
      const mockCase = createMockCase(1);
      mockRepository.findById.mockResolvedValue(mockCase);

      const result = await service.getCaseById(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getCaseById(999)).rejects.toThrow(NotFoundError);
      await expect(service.getCaseById(999)).rejects.toThrow('Case with ID 999 not found');
    });

    it('should propagate other errors from the repository', async () => {
      const mockError = new Error('Repository error');
      mockRepository.findById.mockRejectedValue(mockError);

      await expect(service.getCaseById(1)).rejects.toThrow(mockError);
    });
  });

  describe('createCase', () => {
    it('should create a new case with the provided data', async () => {
      const caseData: Prisma.CaseCreateInput = {
        title: 'New Case',
        description: 'New Description',
        status: CaseStatus.PENDING,
      };
      const mockCase = createMockCase(1);
      mockRepository.create.mockResolvedValue(mockCase);

      const result = await service.createCase(caseData);

      expect(mockRepository.create).toHaveBeenCalledWith(caseData);
      expect(result).toEqual(mockCase);
    });

    it('should propagate errors from the repository', async () => {
      const mockError = new Error('Repository error');
      const caseData: Prisma.CaseCreateInput = {
        title: 'New Case',
        status: CaseStatus.PENDING,
      };
      mockRepository.create.mockRejectedValue(mockError);

      await expect(service.createCase(caseData)).rejects.toThrow(mockError);
    });
  });

  describe('updateCase', () => {
    it('should update an existing case with the provided data', async () => {
      const caseId = 1;
      const updateData: Prisma.CaseUpdateInput = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const mockCase = {
        ...createMockCase(caseId),
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockRepository.findById.mockResolvedValue(createMockCase(caseId));
      mockRepository.update.mockResolvedValue(mockCase);

      const result = await service.updateCase(caseId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(caseId);
      expect(mockRepository.update).toHaveBeenCalledWith(caseId, updateData);
      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundError when trying to update a non-existent case', async () => {
      const caseId = 999;
      const updateData: Prisma.CaseUpdateInput = {
        title: 'Updated Title',
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCase(caseId, updateData)).rejects.toThrow(NotFoundError);
      await expect(service.updateCase(caseId, updateData)).rejects.toThrow(
        `Case with ID ${caseId} not found`,
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should propagate other errors from the repository', async () => {
      const caseId = 1;
      const updateData: Prisma.CaseUpdateInput = {
        title: 'Updated Title',
      };
      const mockError = new Error('Repository error');

      mockRepository.findById.mockRejectedValue(mockError);

      await expect(service.updateCase(caseId, updateData)).rejects.toThrow(mockError);
    });
  });

  describe('updateCaseStatus', () => {
    it('should update only the status of an existing case', async () => {
      const caseId = 1;
      const newStatus = CaseStatus.COMPLETED;
      const mockCase = {
        ...createMockCase(caseId),
        status: newStatus,
      };

      mockRepository.findById.mockResolvedValue(createMockCase(caseId));
      mockRepository.updateStatus.mockResolvedValue(mockCase);

      const result = await service.updateCaseStatus(caseId, newStatus);

      expect(mockRepository.findById).toHaveBeenCalledWith(caseId);
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(caseId, newStatus);
      expect(result).toEqual(mockCase);
      expect(result.status).toEqual(newStatus);
    });

    it('should throw NotFoundError when trying to update status of a non-existent case', async () => {
      const caseId = 999;
      const newStatus = CaseStatus.IN_PROGRESS;

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCaseStatus(caseId, newStatus)).rejects.toThrow(NotFoundError);
      await expect(service.updateCaseStatus(caseId, newStatus)).rejects.toThrow(
        `Case with ID ${caseId} not found`,
      );

      expect(mockRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should propagate other errors from the repository', async () => {
      const caseId = 1;
      const newStatus = CaseStatus.IN_PROGRESS;
      const mockError = new Error('Repository error');

      mockRepository.findById.mockRejectedValue(mockError);

      await expect(service.updateCaseStatus(caseId, newStatus)).rejects.toThrow(mockError);
    });
  });

  describe('deleteCase', () => {
    it('should delete an existing case', async () => {
      const caseId = 1;
      const mockCase = createMockCase(caseId);

      // For the existence check
      mockRepository.findById.mockResolvedValue(mockCase);
      mockRepository.delete.mockResolvedValue(mockCase);

      await service.deleteCase(caseId);

      expect(mockRepository.findById).toHaveBeenCalledWith(caseId);
      expect(mockRepository.delete).toHaveBeenCalledWith(caseId);
    });

    it('should throw NotFoundError when trying to delete a non-existent case', async () => {
      const caseId = 999;

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCase(caseId)).rejects.toThrow(NotFoundError);
      await expect(service.deleteCase(caseId)).rejects.toThrow(`Case with ID ${caseId} not found`);

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should propagate other errors from the repository', async () => {
      const caseId = 1;
      const mockError = new Error('Repository error');

      mockRepository.findById.mockRejectedValue(mockError);

      await expect(service.deleteCase(caseId)).rejects.toThrow(mockError);
    });
  });
});
