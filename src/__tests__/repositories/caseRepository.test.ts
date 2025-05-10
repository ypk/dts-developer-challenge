/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('../../lib/prisma.ts', () => ({
  prisma: {
    case: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
  CaseStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  },
}));

import { prisma, CaseStatus } from '../../lib/prisma.ts';
import { caseRepository } from '../../repositories/caseRepository.ts';

describe('Case Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all cases', async () => {
      const mockCases = [
        { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
        { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
      ];

      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);

      const result = await caseRepository.findAll();

      expect(prisma.case.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.case.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockCases);
    });

    it('should apply pagination when skip and limit are provided', async () => {
      const mockCases = [
        { id: 3, title: 'Case 3', status: CaseStatus.PENDING },
        { id: 4, title: 'Case 4', status: CaseStatus.IN_PROGRESS },
      ];

      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);

      const result = await caseRepository.findAll(10, 2);

      expect(prisma.case.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 2,
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockCases);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated cases with metadata', async () => {
      const mockCases = [
        { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
        { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
      ];
      const totalCount = 25;

      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);
      (prisma.case.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await caseRepository.findAllPaginated(0, 10);

      expect(prisma.case.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
      });
      expect(prisma.case.count).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        data: mockCases,
        meta: {
          total: totalCount,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      });
    });

    it('should calculate page and totalPages correctly', async () => {
      const mockCases = [
        { id: 5, title: 'Case 5', status: CaseStatus.PENDING },
        { id: 6, title: 'Case 6', status: CaseStatus.IN_PROGRESS },
      ];
      const totalCount = 21;
      const skip = 10;
      const limit = 5;

      (prisma.case.findMany as jest.Mock).mockResolvedValue(mockCases);
      (prisma.case.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await caseRepository.findAllPaginated(skip, limit);

      expect(prisma.case.findMany).toHaveBeenCalledWith({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockCases,
        meta: {
          total: totalCount,
          page: 3, // Math.floor(10 / 5) + 1
          limit: 5,
          totalPages: 5, // Math.ceil(21 / 5)
        },
      });
    });
  });

  describe('findById', () => {
    it('should return a case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };

      (prisma.case.findUnique as jest.Mock).mockResolvedValue(mockCase);

      const result = await caseRepository.findById(1);

      expect(prisma.case.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.case.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockCase);
    });

    it('should return null when case does not exist', async () => {
      (prisma.case.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await caseRepository.findById(999);

      expect(prisma.case.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.case.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new case', async () => {
      const caseData = {
        title: 'New Case',
        description: 'Description',
        status: CaseStatus.PENDING,
      };

      const mockCreatedCase = {
        id: 1,
        ...caseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.case.create as jest.Mock).mockResolvedValue(mockCreatedCase);

      const result = await caseRepository.create(caseData);

      expect(prisma.case.create).toHaveBeenCalledTimes(1);
      expect(prisma.case.create).toHaveBeenCalledWith({
        data: caseData,
      });
      expect(result).toEqual(mockCreatedCase);
    });
  });

  describe('update', () => {
    it('should update and return the case', async () => {
      const updateData = {
        title: 'Updated Case',
        status: CaseStatus.IN_PROGRESS,
      };

      const mockUpdatedCase = {
        id: 1,
        ...updateData,
        description: 'Original description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.case.update as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await caseRepository.update(1, updateData);

      expect(prisma.case.update).toHaveBeenCalledTimes(1);
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedCase);
    });
  });

  describe('updateStatus', () => {
    it('should update the status and return the case', async () => {
      const mockUpdatedCase = {
        id: 1,
        title: 'Case 1',
        status: CaseStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.case.update as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await caseRepository.updateStatus(1, CaseStatus.COMPLETED);

      expect(prisma.case.update).toHaveBeenCalledTimes(1);
      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: CaseStatus.COMPLETED },
      });
      expect(result).toEqual(mockUpdatedCase);
    });
  });

  describe('delete', () => {
    it('should delete the case and return it', async () => {
      const mockDeletedCase = {
        id: 1,
        title: 'Case to delete',
        status: CaseStatus.PENDING,
      };

      (prisma.case.delete as jest.Mock).mockResolvedValue(mockDeletedCase);

      const result = await caseRepository.delete(1);

      expect(prisma.case.delete).toHaveBeenCalledTimes(1);
      expect(prisma.case.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeletedCase);
    });
  });
});
