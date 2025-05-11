import { Case, CaseStatus, Prisma } from '../lib/prisma.ts';
import { PaginatedResult } from './ICaseRepository.ts';

/**
 * Interface for case service operations
 */
export interface ICaseService {
  /**
   * Get all cases
   * @returns Promise resolving to array of cases
   */
  getAllCases(): Promise<Case[]>;

  /**
   * Get all cases with pagination
   * @param page Page number (starting from 1)
   * @param limit Maximum number of records per page
   * @returns Promise resolving to paginated result containing cases and metadata
   */
  getAllCasesPaginated(page?: number, limit?: number): Promise<PaginatedResult<Case>>;

  /**
   * Get a case by its ID
   * @param id Case ID
   * @returns Promise resolving to the case
   * @throws NotFoundError if case doesn't exist
   */
  getCaseById(id: number): Promise<Case>;

  /**
   * Create a new case
   * @param data Case data
   * @returns Promise resolving to the created case
   */
  createCase(data: Prisma.CaseCreateInput): Promise<Case>;

  /**
   * Update an existing case
   * @param id Case ID
   * @param data Updated case data
   * @returns Promise resolving to the updated case
   * @throws NotFoundError if case doesn't exist
   */
  updateCase(id: number, data: Prisma.CaseUpdateInput): Promise<Case>;

  /**
   * Update only the status of a case
   * @param id Case ID
   * @param status New case status
   * @returns Promise resolving to the updated case
   * @throws NotFoundError if case doesn't exist
   */
  updateCaseStatus(id: number, status: CaseStatus): Promise<Case>;

  /**
   * Delete a case
   * @param id Case ID
   * @returns Promise resolving when the case is deleted
   * @throws NotFoundError if case doesn't exist
   */
  deleteCase(id: number): Promise<void>;
}
