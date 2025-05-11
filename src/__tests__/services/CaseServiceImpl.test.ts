import { CaseServiceImpl } from '../../services/CaseServiceImpl.ts';
import { ICaseRepository } from '../../interfaces/ICaseRepository.ts';
import { NotFoundError } from '../../middleware/error.middleware.ts';
import { CaseStatus } from '../../lib/prisma.ts';

// Create a mock repository
const mockRepository: jest.Mocked<ICaseRepository> = {
  findAll: jest.fn(),
  findAllPaginated: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

describe('CaseServiceImpl', () => {
  let service: CaseServiceImpl;
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
    jest.clearAllMocks();
    service = new CaseServiceImpl(mockRepository);
  });

  describe('getAllCases', () => {
    it('should return all cases from repository', async () => {
      mockRepository.findAll.mockResolvedValue(mockCases);

      const result = await service.getAllCases();

      expect(result).toEqual(mockCases);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getAllCasesPaginated', () => {
    it('should return paginated cases from repository', async () => {
      const paginatedResult = {
        data: mockCases,
        meta: {
          total: 10,
          page: 2,
          limit: 5,
          totalPages: 2,
        },
      };
      mockRepository.findAllPaginated.mockResolvedValue(paginatedResult);

      const result = await service.getAllCasesPaginated(2, 5);

      expect(result).toEqual(paginatedResult);
      expect(mockRepository.findAllPaginated).toHaveBeenCalledWith(5, 5);
    });

    it('should use default values when not provided', async () => {
      await service.getAllCasesPaginated();

      expect(mockRepository.findAllPaginated).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('getCaseById', () => {
    it('should return a case when found', async () => {
      mockRepository.findById.mockResolvedValue(mockCases[0]);

      const result = await service.getCaseById(1);

      expect(result).toEqual(mockCases[0]);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when case not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getCaseById(999)).rejects.toThrow(NotFoundError);
      await expect(service.getCaseById(999)).rejects.toThrow('Case with ID 999 not found');
    });
  });

  describe('createCase', () => {
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

      mockRepository.create.mockResolvedValue(createdCase);

      const result = await service.createCase(newCase);

      expect(result).toEqual(createdCase);
      expect(mockRepository.create).toHaveBeenCalledWith(newCase);
    });
  });

  describe('updateCase', () => {
    it('should update and return the case when it exists', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const updatedCase = { ...mockCases[0], ...updateData };

      mockRepository.findById.mockResolvedValue(mockCases[0]);
      mockRepository.update.mockResolvedValue(updatedCase);

      const result = await service.updateCase(1, updateData);

      expect(result).toEqual(updatedCase);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw NotFoundError when case not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCase(999, { title: 'Updated' })).rejects.toThrow(NotFoundError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateCaseStatus', () => {
    it('should update only the status when case exists', async () => {
      const updatedCase = {
        ...mockCases[0],
        status: CaseStatus.COMPLETED,
      };

      mockRepository.findById.mockResolvedValue(mockCases[0]);
      mockRepository.updateStatus.mockResolvedValue(updatedCase);

      const result = await service.updateCaseStatus(1, CaseStatus.COMPLETED);

      expect(result).toEqual(updatedCase);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(1, CaseStatus.COMPLETED);
    });

    it('should throw NotFoundError when case not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCaseStatus(999, CaseStatus.COMPLETED)).rejects.toThrow(
        NotFoundError,
      );
      expect(mockRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteCase', () => {
    it('should delete the case when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockCases[0]);
      mockRepository.delete.mockResolvedValue(mockCases[0]);

      await service.deleteCase(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when case not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCase(999)).rejects.toThrow(NotFoundError);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
