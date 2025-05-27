import { CaseService, CaseServiceInstance } from '../../services/CaseService.ts';
import { CaseRepositoryInstance } from '../../repositories/CaseRepository.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';
import { CaseStatus, Prisma } from '../../services/PrismaService.ts';

jest.mock('../../repositories/CaseRepository.ts', () => ({
  CaseRepositoryInstance: {
    findAll: jest.fn(),
    findAllPaginated: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../middleware/error.middleware.ts', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
}));

describe('CaseService', () => {
  let caseService: CaseService;

  const mockCase = {
    id: 1,
    title: 'Test Case',
    description: 'Test Description',
    status: 'PENDING' as CaseStatus,
    dueDate: new Date('2023-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  };

  const mockCases = [mockCase, { ...mockCase, id: 2, title: 'Test Case 2' }];

  const mockPaginatedResult = {
    data: mockCases,
    meta: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    caseService = new CaseService();
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(CaseServiceInstance).toBeInstanceOf(CaseService);
    });

    it('should return the same instance', () => {
      const instance1 = CaseServiceInstance;
      const instance2 = CaseServiceInstance;
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAllCases', () => {
    it('should return all cases from repository', async () => {
      (CaseRepositoryInstance.findAll as jest.Mock).mockResolvedValue(mockCases);

      const result = await caseService.getAllCases();

      expect(CaseRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(mockCases);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      (CaseRepositoryInstance.findAll as jest.Mock).mockRejectedValue(error);

      await expect(caseService.getAllCases()).rejects.toThrow('Database connection failed');
      expect(CaseRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cases exist', async () => {
      (CaseRepositoryInstance.findAll as jest.Mock).mockResolvedValue([]);

      const result = await caseService.getAllCases();

      expect(result).toEqual([]);
      expect(CaseRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllCasesPaginated', () => {
    it('should return paginated cases with default parameters', async () => {
      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await caseService.getAllCasesPaginated();

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should return paginated cases with custom page and limit', async () => {
      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await caseService.getAllCasesPaginated(3, 5);

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(10, 5);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle page 1 correctly', async () => {
      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await caseService.getAllCasesPaginated(1, 20);

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(0, 20);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle large page numbers', async () => {
      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await caseService.getAllCasesPaginated(100, 25);

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(2475, 25);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database pagination failed');
      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockRejectedValue(error);

      await expect(caseService.getAllCasesPaginated(2, 15)).rejects.toThrow(
        'Database pagination failed',
      );
      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(15, 15);
    });
  });

  describe('getCaseById', () => {
    it('should return case when found', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);

      const result = await caseService.getCaseById(1);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundError when case not found', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.getCaseById(999)).rejects.toThrow(NotFoundError);
      await expect(caseService.getCaseById(999)).rejects.toThrow('Case with ID 999 not found');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(999);
    });

    it('should throw NotFoundError when case is undefined', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(caseService.getCaseById(123)).rejects.toThrow(NotFoundError);
      await expect(caseService.getCaseById(123)).rejects.toThrow('Case with ID 123 not found');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(123);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database query failed');
      (CaseRepositoryInstance.findById as jest.Mock).mockRejectedValue(error);

      await expect(caseService.getCaseById(1)).rejects.toThrow('Database query failed');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
    });

    it('should handle different ID types', async () => {
      const testIds = [1, 42, 1000, 999999];

      for (const id of testIds) {
        (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue({ ...mockCase, id });

        const result = await caseService.getCaseById(id);

        expect(result.id).toBe(id);
        expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(id);

        jest.clearAllMocks();
      }
    });
  });

  describe('createCase', () => {
    const mockCreateInput: Prisma.CaseCreateInput = {
      title: 'New Case',
      description: 'New Description',
      status: 'PENDING',
      dueDate: new Date('2023-12-31'),
    };

    it('should create and return new case', async () => {
      const expectedCase = { id: 3, ...mockCreateInput };
      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(expectedCase);

      const result = await caseService.createCase(mockCreateInput);

      expect(CaseRepositoryInstance.create).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.create).toHaveBeenCalledWith(mockCreateInput);
      expect(result).toEqual(expectedCase);
    });

    it('should handle minimal case data', async () => {
      const minimalInput: Prisma.CaseCreateInput = {
        title: 'Minimal Case',
      };
      const expectedCase = { id: 4, ...minimalInput };
      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(expectedCase);

      const result = await caseService.createCase(minimalInput);

      expect(CaseRepositoryInstance.create).toHaveBeenCalledWith(minimalInput);
      expect(result).toEqual(expectedCase);
    });

    it('should handle case with all optional fields', async () => {
      const fullInput: Prisma.CaseCreateInput = {
        title: 'Full Case',
        description: 'Full description',
        status: 'IN_PROGRESS',
        dueDate: new Date('2024-01-01'),
      };
      const expectedCase = { id: 5, ...fullInput };
      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(expectedCase);

      const result = await caseService.createCase(fullInput);

      expect(CaseRepositoryInstance.create).toHaveBeenCalledWith(fullInput);
      expect(result).toEqual(expectedCase);
    });

    it('should handle repository creation errors', async () => {
      const error = new Error('Database constraint violation');
      (CaseRepositoryInstance.create as jest.Mock).mockRejectedValue(error);

      await expect(caseService.createCase(mockCreateInput)).rejects.toThrow(
        'Database constraint violation',
      );
      expect(CaseRepositoryInstance.create).toHaveBeenCalledWith(mockCreateInput);
    });
  });

  describe('updateCase', () => {
    const mockUpdateInput: Prisma.CaseUpdateInput = {
      title: 'Updated Case',
      description: 'Updated Description',
      status: 'IN_PROGRESS',
    };

    it('should update and return case when case exists', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const updatedCase = { ...mockCase, ...mockUpdateInput };
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue(updatedCase);

      const result = await caseService.updateCase(1, mockUpdateInput);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(1, mockUpdateInput);
      expect(result).toEqual(updatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.updateCase(999, mockUpdateInput)).rejects.toThrow(NotFoundError);
      await expect(caseService.updateCase(999, mockUpdateInput)).rejects.toThrow(
        'Case with ID 999 not found',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(999);
      expect(CaseRepositoryInstance.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const partialUpdate: Prisma.CaseUpdateInput = { title: 'Only Title Updated' };
      const updatedCase = { ...mockCase, title: 'Only Title Updated' };
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue(updatedCase);

      const result = await caseService.updateCase(1, partialUpdate);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(1, partialUpdate);
      expect(result).toEqual(updatedCase);
    });

    it('should handle empty update', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const emptyUpdate: Prisma.CaseUpdateInput = {};
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue(mockCase);

      const result = await caseService.updateCase(1, emptyUpdate);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(1, emptyUpdate);
      expect(result).toEqual(mockCase);
    });

    it('should handle repository update errors', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const error = new Error('Database update failed');
      (CaseRepositoryInstance.update as jest.Mock).mockRejectedValue(error);

      await expect(caseService.updateCase(1, mockUpdateInput)).rejects.toThrow(
        'Database update failed',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(1, mockUpdateInput);
    });

    it('should handle findById errors during update', async () => {
      const error = new Error('Database find failed');
      (CaseRepositoryInstance.findById as jest.Mock).mockRejectedValue(error);

      await expect(caseService.updateCase(1, mockUpdateInput)).rejects.toThrow(
        'Database find failed',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).not.toHaveBeenCalled();
    });
  });

  describe('updateCaseStatus', () => {
    const newStatus: CaseStatus = 'COMPLETED';

    it('should update case status when case exists', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const updatedCase = { ...mockCase, status: newStatus };
      (CaseRepositoryInstance.updateStatus as jest.Mock).mockResolvedValue(updatedCase);

      const result = await caseService.updateCaseStatus(1, newStatus);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalledWith(1, newStatus);
      expect(result).toEqual(updatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.updateCaseStatus(999, newStatus)).rejects.toThrow(NotFoundError);
      await expect(caseService.updateCaseStatus(999, newStatus)).rejects.toThrow(
        'Case with ID 999 not found',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(999);
      expect(CaseRepositoryInstance.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle all valid status values', async () => {
      const statusValues: CaseStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

      for (const status of statusValues) {
        jest.clearAllMocks();
        (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
        const updatedCase = { ...mockCase, status };
        (CaseRepositoryInstance.updateStatus as jest.Mock).mockResolvedValue(updatedCase);

        const result = await caseService.updateCaseStatus(1, status);

        expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
        expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalledWith(1, status);
        expect(result.status).toBe(status);
      }
    });

    it('should handle repository updateStatus errors', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const error = new Error('Database status update failed');
      (CaseRepositoryInstance.updateStatus as jest.Mock).mockRejectedValue(error);

      await expect(caseService.updateCaseStatus(1, newStatus)).rejects.toThrow(
        'Database status update failed',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalledWith(1, newStatus);
    });

    it('should handle findById errors during status update', async () => {
      const error = new Error('Database find failed during status update');
      (CaseRepositoryInstance.findById as jest.Mock).mockRejectedValue(error);

      await expect(caseService.updateCaseStatus(1, newStatus)).rejects.toThrow(
        'Database find failed during status update',
      );
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteCase', () => {
    it('should delete case when case exists', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await caseService.deleteCase(1);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.deleteCase(999)).rejects.toThrow(NotFoundError);
      await expect(caseService.deleteCase(999)).rejects.toThrow('Case with ID 999 not found');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(999);
      expect(CaseRepositoryInstance.delete).not.toHaveBeenCalled();
    });

    it('should handle repository delete errors', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      const error = new Error('Database delete failed');
      (CaseRepositoryInstance.delete as jest.Mock).mockRejectedValue(error);

      await expect(caseService.deleteCase(1)).rejects.toThrow('Database delete failed');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.delete).toHaveBeenCalledWith(1);
    });

    it('should handle findById errors during delete', async () => {
      const error = new Error('Database find failed during delete');
      (CaseRepositoryInstance.findById as jest.Mock).mockRejectedValue(error);

      await expect(caseService.deleteCase(1)).rejects.toThrow('Database find failed during delete');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion of different case IDs', async () => {
      const testIds = [1, 42, 100, 999];

      for (const id of testIds) {
        jest.clearAllMocks();
        (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue({ ...mockCase, id });
        (CaseRepositoryInstance.delete as jest.Mock).mockResolvedValue(undefined);

        await caseService.deleteCase(id);

        expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(id);
        expect(CaseRepositoryInstance.delete).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle case where getCaseById returns falsy values', async () => {
      const falsyValues = [null, undefined, false, 0, '', NaN];

      for (const falsyValue of falsyValues) {
        jest.clearAllMocks();
        (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(falsyValue);

        await expect(caseService.getCaseById(1)).rejects.toThrow(NotFoundError);
        expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      }
    });

    it('should handle repository methods returning null/undefined', async () => {
      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(null);
      const result = await caseService.createCase({ title: 'Test' });
      expect(result).toBeNull();

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue(undefined);
      const updateResult = await caseService.updateCase(1, { title: 'Updated' });
      expect(updateResult).toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle rapid sequential operations', async () => {
      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue({
        ...mockCase,
        title: 'Updated',
      });
      (CaseRepositoryInstance.updateStatus as jest.Mock).mockResolvedValue({
        ...mockCase,
        status: 'COMPLETED',
      });
      (CaseRepositoryInstance.delete as jest.Mock).mockResolvedValue(undefined);

      await caseService.createCase({ title: 'Test Case' });

      await caseService.getCaseById(1);

      await caseService.updateCase(1, { title: 'Updated' });

      await caseService.updateCaseStatus(1, 'COMPLETED');

      await caseService.deleteCase(1);

      expect(CaseRepositoryInstance.create).toHaveBeenCalled();
      expect(CaseRepositoryInstance.findById).toHaveBeenCalled();
      expect(CaseRepositoryInstance.update).toHaveBeenCalled();
      expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalled();
      expect(CaseRepositoryInstance.delete).toHaveBeenCalled();
    });

    it('should maintain data consistency across operations', async () => {
      const caseId = 1;
      const initialCase = { ...mockCase, id: caseId };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(initialCase);
      (CaseRepositoryInstance.update as jest.Mock).mockImplementation((id, data) => ({
        ...initialCase,
        ...data,
        updatedAt: new Date(),
      }));

      const updateData = { title: 'New Title' };
      const result = await caseService.updateCase(caseId, updateData);

      expect(result.id).toBe(caseId);
      expect(result.title).toBe('New Title');
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(caseId);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(caseId, updateData);
    });
  });
});
