import { Case, CaseStatus, Prisma } from '@prisma/client';
import { caseRepository } from '../repositories/caseRepository.js';
import { NotFoundError } from '../utils/errorHander.ts';

export const caseService = {
  async getAllCases(): Promise<Case[]> {
    return caseRepository.findAll();
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
