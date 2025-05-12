import { CaseStatus } from '../../services/PrismaService.ts';
import { CaseServiceInstance } from '../../services/CaseService.ts';
import { CaseRepositoryInstance } from '../../repositories/CaseRepository.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';

jest.mock('../../repositories/CaseRepository.ts', () => ({
  CaseRepositoryInstance: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    findAllPaginated: jest.fn(),
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

      (CaseRepositoryInstance.findAll as jest.Mock).mockResolvedValue(mockCases);

      const result = await CaseServiceInstance.getAllCases();

      expect(CaseRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCases);
    });
  });

  describe('getAllCasesPaginated', () => {
    it('should return paginated cases with default values', async () => {
      const mockPaginatedResult = {
        data: [
          { id: 1, title: 'Case 1', status: CaseStatus.PENDING },
          { id: 2, title: 'Case 2', status: CaseStatus.IN_PROGRESS },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await CaseServiceInstance.getAllCasesPaginated();

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(0, 10);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should calculate skip value correctly and pass to repository', async () => {
      const page = 3;
      const limit = 15;
      const expectedSkip = (page - 1) * limit;

      const mockPaginatedResult = {
        data: [
          { id: 31, title: 'Case 31', status: CaseStatus.PENDING },
          { id: 32, title: 'Case 32', status: CaseStatus.IN_PROGRESS },
        ],
        meta: {
          total: 50,
          page: 3,
          limit: 15,
          totalPages: 4,
        },
      };

      (CaseRepositoryInstance.findAllPaginated as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await CaseServiceInstance.getAllCasesPaginated(page, limit);

      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findAllPaginated).toHaveBeenCalledWith(expectedSkip, limit);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('getCaseById', () => {
    it('should return a case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);

      const result = await CaseServiceInstance.getCaseById(1);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(CaseServiceInstance.getCaseById(999)).rejects.toThrow(NotFoundError);
      await expect(CaseServiceInstance.getCaseById(999)).rejects.toThrow(
        'Case with ID 999 not found',
      );

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(2);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(999);
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

      (CaseRepositoryInstance.create as jest.Mock).mockResolvedValue(mockCreatedCase);

      const result = await CaseServiceInstance.createCase(caseData);

      expect(CaseRepositoryInstance.create).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.create).toHaveBeenCalledWith(caseData);
      expect(result).toEqual(mockCreatedCase);
    });
  });

  describe('updateCase', () => {
    it('should update and return the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Original Case', status: CaseStatus.PENDING };
      const updateData = { title: 'Updated Case' };
      const mockUpdatedCase = { ...mockCase, ...updateData };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.update as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await CaseServiceInstance.updateCase(1, updateData);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      const updateData = { title: 'Updated Case' };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(CaseServiceInstance.updateCase(999, updateData)).rejects.toThrow(NotFoundError);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.update).not.toHaveBeenCalled();
    });
  });

  describe('updateCaseStatus', () => {
    it('should update the status and return the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case 1', status: CaseStatus.PENDING };
      const newStatus = CaseStatus.COMPLETED;
      const mockUpdatedCase = { ...mockCase, status: newStatus };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedCase);

      const result = await CaseServiceInstance.updateCaseStatus(1, newStatus);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.updateStatus).toHaveBeenCalledWith(1, newStatus);
      expect(result).toEqual(mockUpdatedCase);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      const newStatus = CaseStatus.COMPLETED;

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(CaseServiceInstance.updateCaseStatus(999, newStatus)).rejects.toThrow(
        NotFoundError,
      );

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteCase', () => {
    it('should delete the case when it exists', async () => {
      const mockCase = { id: 1, title: 'Case to delete', status: CaseStatus.PENDING };

      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(mockCase);
      (CaseRepositoryInstance.delete as jest.Mock).mockResolvedValue(mockCase);

      await CaseServiceInstance.deleteCase(1);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.findById).toHaveBeenCalledWith(1);
      expect(CaseRepositoryInstance.delete).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when case does not exist', async () => {
      (CaseRepositoryInstance.findById as jest.Mock).mockResolvedValue(null);

      await expect(CaseServiceInstance.deleteCase(999)).rejects.toThrow(NotFoundError);

      expect(CaseRepositoryInstance.findById).toHaveBeenCalledTimes(1);
      expect(CaseRepositoryInstance.delete).not.toHaveBeenCalled();
    });
  });
});
