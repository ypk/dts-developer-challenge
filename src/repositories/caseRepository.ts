import { prisma, CaseStatus, Case, Prisma } from '../lib/prisma.ts';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const caseRepository = {
  async findAll(skip?: number, limit?: number): Promise<Case[]> {
    return prisma.case.findMany({
      ...(skip !== undefined && { skip }),
      ...(limit !== undefined && { take: limit }),
      orderBy: { updatedAt: 'desc' },
    });
  },

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
  },

  async findById(id: number): Promise<Case | null> {
    return prisma.case.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.CaseCreateInput): Promise<Case> {
    return prisma.case.create({
      data,
    });
  },

  async update(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data,
    });
  },

  async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    return prisma.case.update({
      where: { id },
      data: { status },
    });
  },

  async delete(id: number): Promise<Case> {
    return prisma.case.delete({
      where: { id },
    });
  },
};
