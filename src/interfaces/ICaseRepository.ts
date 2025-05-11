import { Case, Prisma, CaseStatus } from '../lib/prisma.ts';

/**
 * Interface for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Interface for case repository operations
 */
export interface ICaseRepository {
  /**
   * Find all cases with optional pagination
   * @param skip Number of records to skip
   * @param limit Maximum number of records to return
   * @returns Array of cases
   */
  findAll(skip?: number, limit?: number): Promise<Case[]>;

  /**
   * Find all cases with pagination metadata
   * @param skip Number of records to skip
   * @param limit Maximum number of records to return
   * @returns Paginated result containing cases and metadata
   */
  findAllPaginated(skip?: number, limit?: number): Promise<PaginatedResult<Case>>;

  /**
   * Find a case by its ID
   * @param id Case ID
   * @returns Case if found, null otherwise
   */
  findById(id: number): Promise<Case | null>;

  /**
   * Create a new case
   * @param data Case data
   * @returns Created case
   */
  create(data: Prisma.CaseCreateInput): Promise<Case>;

  /**
   * Update an existing case
   * @param id Case ID
   * @param data Updated case data
   * @returns Updated case
   */
  update(id: number, data: Prisma.CaseUpdateInput): Promise<Case>;

  /**
   * Update only the status of a case
   * @param id Case ID
   * @param status New case status
   * @returns Updated case
   */
  updateStatus(id: number, status: CaseStatus): Promise<Case>;

  /**
   * Delete a case
   * @param id Case ID
   * @returns Deleted case
   */
  delete(id: number): Promise<Case>;
}
