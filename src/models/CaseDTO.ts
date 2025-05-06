import { CaseStatus } from '@prisma/client';

export interface CreateCaseDto {
  title: string;
  description?: string;
  status?: CaseStatus;
  dueDate?: Date | string;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  status?: CaseStatus;
  dueDate?: Date | string;
}

export interface UpdateCaseStatusDto {
  status: CaseStatus;
}

export interface CaseResponseDto {
  id: number;
  title: string;
  description: string | null;
  status: CaseStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
