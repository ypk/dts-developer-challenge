import { Case, CaseStatus, Prisma } from '../lib/prisma.ts';
import { ICaseRepository, PaginatedResult } from '../interfaces/ICaseRepository.ts';
import { prisma } from '../lib/prisma.ts';

/**
 * Implementation of the case repository interface
 */
export class CaseRepositoryImpl implements ICaseRepository {
  /**
   * Find all cases with optional pagination
   * @param skip Number of records to skip
   * @param limit Maximum number of records to return
   * @returns Array of cases
   */
  async findAll(skip?: number, limit?: number): Promise<Case[]> {
    return prisma.case.findMany({
      ...(skip !== undefined && { skip }),
      ...(limit !== undefined && { take: limit }),
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find all cases with pagination metadata
   * @param skip Number of records to skip
   * @param limit Maximum number of records to return
   * @returns Paginated result containing cases and metadata
   */
  async findAllPaginated(skip = 0, limit = 10): Promise<PaginatedResult<Case>> {
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
   * Find a case by its ID
   * @param id Case ID
   * @returns Case if found, null otherwise
   */
  async findById(id: number): Promise<Case | null> {
    return prisma.case.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new case
   * @param data Case data
   * @returns Created case
   */
  async create(data: Prisma.CaseCreateInput): Promise<Case> {
    return prisma.case.create({
      data,
    });
  }

  /**
   * Update an existing case
   * @param id Case ID
   * @param data Updated case data
   * @returns Updated case
   */
  async update(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data,
    });
  }

  /**
   * Update only the status of a case
   * @param id Case ID
   * @param status New case status
   * @returns Updated case
   */
  async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Delete a case
   * @param id Case ID
   * @returns Deleted case
   */
  async delete(id: number): Promise<Case> {
    return prisma.case.delete({
      where: { id },
    });
  }
}

// Create a singleton instance
export const caseRepositoryImpl = new CaseRepositoryImpl();
