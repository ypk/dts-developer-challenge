/**
 * Case Repository Module
 * @module CaseRepository
 * @description Provides data access functions for Case entities using Prisma
 */

import { prisma, CaseStatus, Case, Prisma } from '../services/PrismaService.ts';
import { handlePrismaError } from '../utils/caseHelper.ts';

/**
 * Interface for paginated query results
 * @interface PaginatedResult
 * @template T - The type of items in the result collection
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
   * @throws {DatabaseError} If there's an error retrieving cases
   */
  public async findAll(skip?: number, limit?: number): Promise<Case[]> {
    try {
      return await prisma.case.findMany({
        ...(skip !== undefined && { skip }),
        ...(limit !== undefined && { take: limit }),
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'find all');
    }
  }

  /**
   * Retrieves paginated case records with metadata
   * @async
   * @param {number} [skip=0] - Number of records to skip
   * @param {number} [limit=10] - Maximum number of records to return per page
   * @returns {Promise<PaginatedResult<Case>>} Promise resolving to paginated cases with metadata
   * @throws {DatabaseError} If there's an error retrieving cases
   */
  public async findAllPaginated(skip = 0, limit = 10): Promise<PaginatedResult<Case>> {
    try {
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
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'find paginated');
    }
  }

  /**
   * Finds a case by its unique identifier
   * @async
   * @param {number} id - The ID of the case to retrieve
   * @returns {Promise<Case | null>} Promise resolving to the case or null if not found
   * @throws {DatabaseError} If there's an error retrieving the case
   */
  public async findById(id: number): Promise<Case | null> {
    try {
      return await prisma.case.findUnique({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'find by id', id);
    }
  }

  /**
   * Creates a new case record
   * @async
   * @param {Prisma.CaseCreateInput} data - The case data to create
   * @returns {Promise<Case>} Promise resolving to the newly created case
   * @throws {DatabaseError} If there's an error creating the case
   */
  public async create(data: Prisma.CaseCreateInput): Promise<Case> {
    try {
      return await prisma.case.create({
        data,
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'create');
    }
  }

  /**
   * Updates an existing case
   * @async
   * @param {number} id - The ID of the case to update
   * @param {Prisma.CaseUpdateInput} data - The data to update the case with
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws {NotFoundError} If the case with the specified ID doesn't exist
   * @throws {DatabaseError} If there's an error updating the case
   */
  public async update(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    try {
      return await prisma.case.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'update', id);
    }
  }

  /**
   * Updates only the status of an existing case
   * @async
   * @param {number} id - The ID of the case to update
   * @param {CaseStatus} status - The new status for the case
   * @returns {Promise<Case>} Promise resolving to the updated case
   * @throws {NotFoundError} If the case with the specified ID doesn't exist
   * @throws {DatabaseError} If there's an error updating the case status
   */
  public async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    try {
      return await prisma.case.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'update status', id);
    }
  }

  /**
   * Deletes a case by its ID
   * @async
   * @param {number} id - The ID of the case to delete
   * @returns {Promise<Case>} Promise resolving to the deleted case
   * @throws {NotFoundError} If the case with the specified ID doesn't exist
   * @throws {DatabaseError} If there's an error deleting the case
   */
  public async delete(id: number): Promise<Case> {
    try {
      return await prisma.case.delete({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error, 'Case', 'delete', id);
    }
  }
}

/**
 * Singleton instance of the CaseRepository class
 * @type {CaseRepository}
 * @const
 * @description Provides centralized access to the CaseRepository throughout the application
 */
export const CaseRepositoryInstance = new CaseRepository();
