/* eslint-disable @typescript-eslint/unbound-method */
import { CaseStatus } from '@prisma/client';
import { caseRepository } from '../../repositories/caseRepository.ts';
import prisma from '../../lib/prisma.ts';

jest.mock('../../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    case: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

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
      expect(result).toEqual(mockCases);
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
