/**
 * Case Service Module
 * @module CaseService
 * @description Provides business logic for case management operations
 */

import { Case, CaseStatus, Prisma } from './PrismaService.js';
import { CaseRepositoryInstance, PaginatedResult } from '../repositories/CaseRepository.ts';
import { NotFoundError } from '../middleware/error.middleware.js';

/**
 * Service class for handling case-related business logic
 * @class CaseService
 */
export class CaseService {
  /**
   * Retrieves all cases from the repository
   * @async
   * @returns {Promise<Case[]>} Promise resolving to an array of all cases
   */
  public async getAllCases(): Promise<Case[]> {
    return CaseRepositoryInstance.findAll();
  }

  /**
   * Retrieves a paginated list of cases
   * @async
   * @param {number} [page=1] - The page number to retrieve (1-based)
   * @param {number} [limit=10] - The number of items per page
   * @returns {Promise<PaginatedResult<Case>>} Promise resolving to paginated cases with metadata
   */
  public async getAllCasesPaginated(page = 1, limit = 10): Promise<PaginatedResult<Case>> {
    const skip = (page - 1) * limit;
    return CaseRepositoryInstance.findAllPaginated(skip, limit);
  }

  /**
   * Retrieves a specific case by its ID
   * @async
   * @param {number} id - The ID of the case to retrieve
   * @returns {Promise<Case>} Promise resolving to the requested case
   * @throws {NotFoundError} If no case with the specified ID exists
   */
  public async getCaseById(id: number): Promise<Case> {
    const caseData = await CaseRepositoryInstance.findById(id);
    if (!caseData) {
      throw new NotFoundError(`Case with ID ${id} not found`);
    }
    return caseData;
  }

  /**
   * Creates a new case
   * @async
   * @param {Prisma.CaseCreateInput} data - The case data to create
   * @returns {Promise<Case>} Promise resolving to the newly created case
   */
  public async createCase(data: Prisma.CaseCreateInput): Promise<Case> {
    return CaseRepositoryInstance.create(data);
  }

  /**
   * Updates an existing case
   * @async
   * @param {number} id - The ID of the case to update
   * @param {Prisma.CaseUpdateInput} data - The case data to update
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws {NotFoundError} If no case with the specified ID exists
   */
  public async updateCase(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    await this.getCaseById(id);
    return CaseRepositoryInstance.update(id, data);
  }

  /**
   * Updates only the status of an existing case
   * @async
   * @param {number} id - The ID of the case to update
   * @param {CaseStatus} status - The new status value
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws {NotFoundError} If no case with the specified ID exists
   */
  public async updateCaseStatus(id: number, status: CaseStatus): Promise<Case> {
    await this.getCaseById(id);
    return CaseRepositoryInstance.updateStatus(id, status);
  }

  /**
   * Deletes a case by its ID
   * @async
   * @param {number} id - The ID of the case to delete
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   * @throws {NotFoundError} If no case with the specified ID exists
   */
  public async deleteCase(id: number): Promise<void> {
    await this.getCaseById(id);
    await CaseRepositoryInstance.delete(id);
  }
}

/**
 * Singleton instance of the CaseService class
 * @type {CaseService}
 */
export const CaseServiceInstance = new CaseService();
