/**
 * Case Data Transfer Objects (DTOs)
 * @module CaseDTO
 * @description Defines the data structures used for case-related API operations
 */

import { CaseStatus } from '../services/PrismaService.ts';

/**
 * Data transfer object for creating a new case
 * @interface CreateCaseDto
 */
export interface CreateCaseDto {
  title: string;
  description?: string;
  status?: CaseStatus;
  dueDate?: Date | string;
}

/**
 * Data transfer object for updating an existing case
 * @interface UpdateCaseDto
 * @description All fields are optional, allowing partial updates
 */
export interface UpdateCaseDto {
  title?: string;
  description?: string;
  status?: CaseStatus;
  dueDate?: Date | string;
}

/**
 * Data transfer object for updating only the status of a case
 * @interface UpdateCaseStatusDto
 */
export interface UpdateCaseStatusDto {
  status: CaseStatus;
}

/**
 * Data transfer object for case responses returned by the API
 * @interface CaseResponseDto
 * @description Contains all case data including database-generated fields
 */
export interface CaseResponseDto {
  id: number;
  title: string;
  description: string | null;
  status: CaseStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
