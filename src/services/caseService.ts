import { Case, CaseStatus, Prisma } from '../lib/prisma.ts';
import { ICaseRepository, PaginatedResult } from '../interfaces/ICaseRepository.ts';
import { ICaseService } from '../interfaces/ICaseService.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';
import { CaseRepositoryInstance } from '../repositories/CaseRepository.ts';

/**
 * Implementation of the case service interface
 */
export class CaseService implements ICaseService {
  private repository: ICaseRepository;

  /**
   * Constructor
   * @param repository Case repository implementation
   */
  constructor(repository: ICaseRepository) {
    this.repository = repository;
  }

  /**
   * Get all cases
   * @returns Promise resolving to array of cases
   */
  async getAllCases(): Promise<Case[]> {
    return this.repository.findAll();
  }

  /**
   * Get all cases with pagination
   * @param page Page number (starting from 1)
   * @param limit Maximum number of records per page
   * @returns Promise resolving to paginated result containing cases and metadata
   */
  async getAllCasesPaginated(page = 1, limit = 10): Promise<PaginatedResult<Case>> {
    const skip = (page - 1) * limit;
    return this.repository.findAllPaginated(skip, limit);
  }

  /**
   * Get a case by its ID
   * @param id Case ID
   * @returns Promise resolving to the case
   * @throws NotFoundError if case doesn't exist
   */
  async getCaseById(id: number): Promise<Case> {
    const caseData = await this.repository.findById(id);
    if (!caseData) {
      throw new NotFoundError(`Case with ID ${id} not found`);
    }
    return caseData;
  }

  /**
   * Create a new case
   * @param data Case data
   * @returns Promise resolving to the created case
   */
  async createCase(data: Prisma.CaseCreateInput): Promise<Case> {
    return this.repository.create(data);
  }

  /**
   * Update an existing case
   * @param id Case ID
   * @param data Updated case data
   * @returns Promise resolving to the updated case
   * @throws NotFoundError if case doesn't exist
   */
  async updateCase(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    await this.getCaseById(id);
    return this.repository.update(id, data);
  }

  /**
   * Update only the status of a case
   * @param id Case ID
   * @param status New case status
   * @returns Promise resolving to the updated case
   * @throws NotFoundError if case doesn't exist
   */
  async updateCaseStatus(id: number, status: CaseStatus): Promise<Case> {
    await this.getCaseById(id);
    return this.repository.updateStatus(id, status);
  }

  /**
   * Delete a case
   * @param id Case ID
   * @returns Promise resolving when the case is deleted
   * @throws NotFoundError if case doesn't exist
   */
  async deleteCase(id: number): Promise<void> {
    await this.getCaseById(id);
    await this.repository.delete(id);
  }
}

// Create a singleton instance using the repository implementation
export const CaseServiceInstance = new CaseService(CaseRepositoryInstance);
