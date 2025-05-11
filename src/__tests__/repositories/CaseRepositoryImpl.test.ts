import { CaseRepositoryImpl } from '../../repositories/CaseRepositoryImpl.ts';
import { prisma, CaseStatus } from '../../lib/prisma.ts';

// Mock the Prisma client
jest.mock('../../lib/prisma.ts', () => {
  const mockPrisma = {
    case: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    CaseStatus: {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
    },
  };
});

describe('CaseRepositoryImpl', () => {
  let repository: CaseRepositoryImpl;
  const mockCases = [
    {
      id: 1,
      title: 'Test Case 1',
      description: 'Description 1',
      status: CaseStatus.PENDING,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      title: 'Test Case 2',
      description: 'Description 2',
      status: CaseStatus.IN_PROGRESS,
      dueDate: new Date('2023-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    repository = new CaseRepositoryImpl();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all cases', async () => {
      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);

      const result = await repository.findAll();

      expect(result).toEqual(mockCases);
      expect(prisma.case.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should apply skip and limit when provided', async () => {
      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);

      await repository.findAll(10, 20);

      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated cases with metadata', async () => {
      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);
      (prisma.case.count as jest.Mock).mockResolvedValue(10);

      const result = await repository.findAllPaginated(0, 5);

      expect(result).toEqual({
        data: mockCases,
        meta: {
          total: 10,
          page: 1,
          limit: 5,
          totalPages: 2,
        },
      });
      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should use default values when not provided', async () => {
      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);
      (prisma.case.count as jest.Mock).mockResolvedValue(10);

      await repository.findAllPaginated();

      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should handle invalid limit by using default', async () => {
      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);
      (prisma.case.count as jest.Mock).mockResolvedValue(10);

      await repository.findAllPaginated(0, -5);

      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a case when found', async () => {
      (prisma.case.findUnique as jest.Mock).mockResolvedValue(mockCases[0]);

      const result = await repository.findById(1);

      expect(result).toEqual(mockCases[0]);
      expect(prisma.case.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when case not found', async () => {
      (prisma.case.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new case', async () => {
      const newCase = {
        title: 'New Case',
        description: 'New Description',
        status: CaseStatus.PENDING,
      };
      const createdCase = {
        id: 3,
        ...newCase,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.case.create as jest.Mock).mockResolvedValue(createdCase);

      const result = await repository.create(newCase);

      expect(result).toEqual(createdCase);
      expect(prisma.case.create).toHaveBeenCalledWith({
        data: newCase,
      });
    });
  });

  describe('update', () => {
    it('should update and return the case', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const updatedCase = { ...mockCases[0], ...updateData };

      (prisma.case.update as jest.Mock).mockResolvedValue(updatedCase);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedCase);
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('updateStatus', () => {
    it('should update only the status of a case', async () => {
      const updatedCase = { ...mockCases[0], status: CaseStatus.COMPLETED };

      (prisma.case.update as jest.Mock).mockResolvedValue(updatedCase);

      const result = await repository.updateStatus(1, CaseStatus.COMPLETED);

      expect(result).toEqual(updatedCase);
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: CaseStatus.COMPLETED },
      });
    });
  });

  describe('delete', () => {
    it('should delete and return the deleted case', async () => {
      (prisma.case.delete as jest.Mock).mockResolvedValue(mockCases[0]);

      const result = await repository.delete(1);

      expect(result).toEqual(mockCases[0]);
      expect(prisma.case.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
