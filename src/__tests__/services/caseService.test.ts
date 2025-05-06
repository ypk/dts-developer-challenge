/* eslint-disable @typescript-eslint/unbound-method */
import { CaseStatus } from '../../lib/prisma.ts';
import { caseService } from '../../services/caseService.ts';
import { caseRepository } from '../../repositories/caseRepository.ts';
import { NotFoundError } from '../../utils/errorHandler.ts';

jest.mock('../../repositories/caseRepository.ts', () => ({
  caseRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Case Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCases', () => {
    it('should return all cases from repository', async () => {
      const mockCases = [
        { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
        { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
      ];

      (caseRepository.findAll as jest.Mock).mockResolvedValue(mockCases);

      const result = await caseService.getAllCases();

      expect(caseRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCases);
    });
  });

  describe('getCaseById', () => {
    it('should return a case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };

      (caseRepository.findById as jest.Mock).mockResolvedValue(mockCase);

      const result = await caseService.getCaseById(1);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (caseRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.getCaseById(999)).rejects.toThrow(NotFoundError);
      await expect(caseService.getCaseById(999)).rejects.toThrow('Case with ID 999 not found');

      expect(caseRepository.findById).toHaveBeenCalledTimes(2);
      expect(caseRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('createCase', () => {
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

      (caseRepository.create as jest.Mock).mockResolvedValue(mockCreatedCase);

      const result = await caseService.createCase(caseData);

      expect(caseRepository.create).toHaveBeenCalledTimes(1);
      expect(caseRepository.create).toHaveBeenCalledWith(caseData);
      expect(result).toEqual(mockCreatedCase);
    });
  });

  describe('updateCase', () => {
    it('should update and return the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Original Case', status: CaseStatus.PENDING };
      const updateData = { title: 'Updated Case' };
      const mockUpdatedCase = { ...mockCase, ...updateData };

      (caseRepository.findById as jest.Mock).mockResolvedValue(mockCase);
      (caseRepository.update as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await caseService.updateCase(1, updateData);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.findById).toHaveBeenCalledWith(1);
      expect(caseRepository.update).toHaveBeenCalledTimes(1);
      expect(caseRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      const updateData = { title: 'Updated Case' };

      (caseRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.updateCase(999, updateData)).rejects.toThrow(NotFoundError);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateCaseStatus', () => {
    it('should update the status and return the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };
      const newStatus = CaseStatus.COMPLETED;
      const mockUpdatedCase = { ...mockCase, status: newStatus };

      (caseRepository.findById as jest.Mock).mockResolvedValue(mockCase);
      (caseRepository.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await caseService.updateCaseStatus(1, newStatus);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.findById).toHaveBeenCalledWith(1);
      expect(caseRepository.updateStatus).toHaveBeenCalledTimes(1);
      expect(caseRepository.updateStatus).toHaveBeenCalledWith(1, newStatus);
      expect(result).toEqual(mockUpdatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      const newStatus = CaseStatus.COMPLETED;

      (caseRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.updateCaseStatus(999, newStatus)).rejects.toThrow(NotFoundError);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteCase', () => {
    it('should delete the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case to delete', status: CaseStatus.PENDING };

      (caseRepository.findById as jest.Mock).mockResolvedValue(mockCase);
      (caseRepository.delete as jest.Mock).mockResolvedValue(mockCase);

      await caseService.deleteCase(1);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.findById).toHaveBeenCalledWith(1);
      expect(caseRepository.delete).toHaveBeenCalledTimes(1);
      expect(caseRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (caseRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(caseService.deleteCase(999)).rejects.toThrow(NotFoundError);

      expect(caseRepository.findById).toHaveBeenCalledTimes(1);
      expect(caseRepository.delete).not.toHaveBeenCalled();
    });
  });
});
