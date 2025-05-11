import { Case, CaseStatus, Prisma } from './PrismaService.ts';
import { caseRepository, PaginatedResult } from '../repositories/caseRepository.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';

export const caseService = {
  async getAllCases(): Promise<Case[]> {
    return caseRepository.findAll();
  },

  async getAllCasesPaginated(page = 1, limit = 10): Promise<PaginatedResult<Case>> {
    const skip = (page - 1) * limit;
    return caseRepository.findAllPaginated(skip, limit);
  },

  async getCaseById(id: number): Promise<Case> {
    const caseData = await caseRepository.findById(id);
    if (!caseData) {
      throw new NotFoundError(`Case with ID ${id} not found`);
    }
    return caseData;
  },

  async createCase(data: Prisma.CaseCreateInput): Promise<Case> {
    return caseRepository.create(data);
  },

  async updateCase(id: number, data: Prisma.CaseUpdateInput): Promise<Case> {
    await this.getCaseById(id);
    return caseRepository.update(id, data);
  },

  async updateCaseStatus(id: number, status: CaseStatus): Promise<Case> {
    await this.getCaseById(id);
    return caseRepository.updateStatus(id, status);
  },

  async deleteCase(id: number): Promise<void> {
    await this.getCaseById(id);
    await caseRepository.delete(id);
  },
};
