import { Case, CaseStatus, Prisma } from '../../lib/prisma.ts';
import { CaseRepository } from '../../repositories/CaseRepository.ts';

jest.mock('../../lib/prisma.ts', () => {
  const mockPrismaCase = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  return {
    prisma: {
      case: mockPrismaCase,
    },
    CaseStatus: {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
    },
  };
});

import { prisma } from '../../lib/prisma.ts';

describe('CaseRepository', () => {
  let repository: CaseRepository;
  const mockPrismaCase = prisma.case as jest.Mocked<typeof prisma.case>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new CaseRepository();
  });

  const createMockCase = (id: number = 1): Case => ({
    id,
    title: `Test Case ${id}`,
    description: `Description for test case ${id}`,
    status: CaseStatus.PENDING,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('findAll', () => {
    it('should find all cases without pagination parameters', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      mockPrismaCase.findMany.mockResolvedValue(mockCases);

      const result = await repository.findAll();

      expect(mockPrismaCase.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockCases);
    });

    it('should find all cases with pagination parameters', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      mockPrismaCase.findMany.mockResolvedValue(mockCases);

      const result = await repository.findAll(10, 20);

      expect(mockPrismaCase.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockCases);
    });

    it('should handle Prisma error', async () => {
      const mockError = new Error('Database error');
      mockPrismaCase.findMany.mockRejectedValue(mockError);

      await expect(repository.findAll()).rejects.toThrow(mockError);
    });
  });

  describe('findAllPaginated', () => {
    it('should find all cases with pagination metadata', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      const totalCases = 20;
      mockPrismaCase.findMany.mockResolvedValue(mockCases);
      mockPrismaCase.count.mockResolvedValue(totalCases);

      const result = await repository.findAllPaginated(10, 5);

      expect(mockPrismaCase.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockPrismaCase.count).toHaveBeenCalled();

      expect(result).toEqual({
        data: mockCases,
        meta: {
          total: totalCases,
          page: 3,
          limit: 5,
          totalPages: 4,
        },
      });
    });

    it('should use default pagination parameters when not provided', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      const totalCases = 20;
      mockPrismaCase.findMany.mockResolvedValue(mockCases);
      mockPrismaCase.count.mockResolvedValue(totalCases);

      const result = await repository.findAllPaginated();

      expect(mockPrismaCase.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      expect(result.meta).toEqual({
        total: totalCases,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
    });

    it('should use safe limit when provided limit is <= 0', async () => {
      const mockCases = [createMockCase(1), createMockCase(2)];
      const totalCases = 20;
      mockPrismaCase.findMany.mockResolvedValue(mockCases);
      mockPrismaCase.count.mockResolvedValue(totalCases);

      const result = await repository.findAllPaginated(0, -5);

      expect(mockPrismaCase.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should handle Prisma error', async () => {
      const mockError = new Error('Database error');
      mockPrismaCase.findMany.mockRejectedValue(mockError);

      await expect(repository.findAllPaginated()).rejects.toThrow(mockError);
    });
  });

  describe('findById', () => {
    it('should find a case by ID', async () => {
      const mockCase = createMockCase(1);
      mockPrismaCase.findUnique.mockResolvedValue(mockCase);

      const result = await repository.findById(1);

      expect(mockPrismaCase.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockCase);
    });

    it('should return null when case does not exist', async () => {
      mockPrismaCase.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(mockPrismaCase.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should handle Prisma error', async () => {
      const mockError = new Error('Database error');
      mockPrismaCase.findUnique.mockRejectedValue(mockError);

      await expect(repository.findById(1)).rejects.toThrow(mockError);
    });
  });

  describe('create', () => {
    it('should create a new case', async () => {
      const mockCase = createMockCase(1);
      const createInput: Prisma.CaseCreateInput = {
        title: 'New Case',
        description: 'New Description',
        status: CaseStatus.PENDING,
      };

      mockPrismaCase.create.mockResolvedValue(mockCase);

      const result = await repository.create(createInput);

      expect(mockPrismaCase.create).toHaveBeenCalledWith({
        data: createInput,
      });
      expect(result).toEqual(mockCase);
    });

    it('should handle Prisma error', async () => {
      const mockError = new Error('Database error');
      const createInput: Prisma.CaseCreateInput = {
        title: 'New Case',
        status: CaseStatus.PENDING,
      };

      mockPrismaCase.create.mockRejectedValue(mockError);

      await expect(repository.create(createInput)).rejects.toThrow(mockError);
    });
  });

  describe('update', () => {
    it('should update an existing case', async () => {
      const mockCase = createMockCase(1);
      const updateInput: Prisma.CaseUpdateInput = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockPrismaCase.update.mockResolvedValue({
        ...mockCase,
        title: 'Updated Title',
        description: 'Updated Description',
      });

      const result = await repository.update(1, updateInput);

      expect(mockPrismaCase.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateInput,
      });
      expect(result.title).toEqual('Updated Title');
      expect(result.description).toEqual('Updated Description');
    });

    it('should handle Prisma error when case does not exist', async () => {
      const mockError = new Error('Record to update not found');
      const updateInput: Prisma.CaseUpdateInput = {
        title: 'Updated Title',
      };

      mockPrismaCase.update.mockRejectedValue(mockError);

      await expect(repository.update(999, updateInput)).rejects.toThrow(mockError);
    });
  });

  describe('updateStatus', () => {
    it('should update only the status of a case', async () => {
      const mockCase = createMockCase(1);
      const newStatus = CaseStatus.COMPLETED;

      mockPrismaCase.update.mockResolvedValue({
        ...mockCase,
        status: newStatus,
      });

      const result = await repository.updateStatus(1, newStatus);

      expect(mockPrismaCase.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: newStatus },
      });
      expect(result.status).toEqual(newStatus);
    });

    it('should handle Prisma error', async () => {
      const mockError = new Error('Database error');
      mockPrismaCase.update.mockRejectedValue(mockError);

      await expect(repository.updateStatus(1, CaseStatus.IN_PROGRESS)).rejects.toThrow(mockError);
    });
  });

  describe('delete', () => {
    it('should delete a case', async () => {
      const mockCase = createMockCase(1);
      mockPrismaCase.delete.mockResolvedValue(mockCase);

      const result = await repository.delete(1);

      expect(mockPrismaCase.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockCase);
    });

    it('should handle Prisma error when case does not exist', async () => {
      const mockError = new Error('Record to delete not found');
      mockPrismaCase.delete.mockRejectedValue(mockError);

      await expect(repository.delete(999)).rejects.toThrow(mockError);
    });
  });
});
