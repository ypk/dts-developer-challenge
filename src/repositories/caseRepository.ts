import { prisma, CaseStatus, Case, Prisma } from '../lib/prisma.js';

export const caseRepository = {
  async findAll(): Promise<Case[]> {
    return prisma.case.findMany();
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
