/**
 * Case Repository Module
 * @module CaseRepository
 * @description Provides data access functions for Case entities using Prisma
 */

import { prisma, CaseStatus, Case, Prisma } from '../services/PrismaService.ts';

/**
 * Interface for paginated query results
 * @interface PaginatedResult
 * @template T - The type of items in the result collection
 */
export interface PaginatedResult<T> {
  /** Array of data items */
  data: T[];
  /** Pagination metadata */
  meta: {
    /** Total number of items across all pages */
    total: number;
    /** Current page number (1-based) */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of pages available */
    totalPages: number;
  };
}

/**
 * Repository class for handling Case data operations
 * @class CaseRepository
 * @description Provides methods for CRUD operations on Case entities
 */
export class CaseRepository {
  /**
   * Retrieves all cases with optional pagination parameters
   * @async
   * @param {number} [skip] - Number of records to skip
   * @param {number} [limit] - Maximum number of records to return
   * @returns {Promise<Case[]>} Promise resolving to an array of cases
   */
  public async findAll(skip?: number, limit?: number): Promise<Case[]> {
    return prisma.case.findMany({
      ...(skip !== undefined && { skip }),
      ...(limit !== undefined && { take: limit }),
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Retrieves paginated case records with metadata
   * @async
   * @param {number} [skip=0] - Number of records to skip
   * @param {number} [limit=10] - Maximum number of records to return per page
   * @returns {Promise<PaginatedResult<Case>>} Promise resolving to paginated cases with metadata
   */
  public async findAllPaginated(skip = 0, limit = 10): Promise<PaginatedResult<Case>> {
    const safeLimit = limit <= 0 ? 10 : limit;

    const [data, total] = await Promise.all([
      prisma.case.findMany({
        skip,
        take: safeLimit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.case.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page: Math.floor(skip / safeLimit) + 1,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Finds a case by its unique identifier
   * @async
   * @param {number} id - The ID of the case to retrieve
   * @returns {Promise<Case | null>} Promise resolving to the case or null if not found
   */
  public async findById(id: number): Promise<Case | null> {
    return prisma.case.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new case record
   * @async
   * @param {Prisma.CaseCreateInput} data - The case data to create
   * @returns {Promise<Case>} Promise resolving to the newly created case
   */
  public async create(data: Prisma.CaseCreateInput): Promise<Case> {
    return prisma.case.create({
      data,
    });
  }

  /**
   * Updates an existing case record
   * @async
   * @param {number} id - The ID of the case to update
   * @param {Prisma.CaseUpdateInput} data - The case data to update
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws Will throw an error if the case doesn't exist
   */
  public async update(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data,
    });
  }

  /**
   * Updates only the status of an existing case
   * @async
   * @param {number} id - The ID of the case to update
   * @param {CaseStatus} status - The new status value
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws Will throw an error if the case doesn't exist
   */
  public async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Deletes a case by its ID
   * @async
   * @param {number} id - The ID of the case to delete
   * @returns {Promise<Case>} Promise resolving to the deleted case
   * @throws Will throw an error if the case doesn't exist
   */
  public async delete(id: number): Promise<Case> {
    return prisma.case.delete({
      where: { id },
    });
  }
}

/**
 * Singleton instance of the CaseRepository class
 * @type {CaseRepository}
 */
export const CaseRepositoryInstance = new CaseRepository();
