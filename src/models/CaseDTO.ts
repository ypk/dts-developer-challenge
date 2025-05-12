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
  /** The title of the case (required) */
  title: string;
  /** Optional description of the case */
  description?: string;
  /** The status of the case (defaults to PENDING if not provided) */
  status?: CaseStatus;
  /** Optional due date for the case (can be provided as Date object or ISO string) */
  dueDate?: Date | string;
}

/**
 * Data transfer object for updating an existing case
 * @interface UpdateCaseDto
 * @description All fields are optional, allowing partial updates
 */
export interface UpdateCaseDto {
  /** The title of the case */
  title?: string;
  /** Description of the case */
  description?: string;
  /** The status of the case */
  status?: CaseStatus;
  /** Due date for the case (can be provided as Date object or ISO string) */
  dueDate?: Date | string;
}

/**
 * Data transfer object for updating only the status of a case
 * @interface UpdateCaseStatusDto
 */
export interface UpdateCaseStatusDto {
  /** The new status to set for the case (required) */
  status: CaseStatus;
}

/**
 * Data transfer object for case responses returned by the API
 * @interface CaseResponseDto
 * @description Contains all case data including database-generated fields
 */
export interface CaseResponseDto {
  /** Unique identifier for the case */
  id: number;
  /** The title of the case */
  title: string;
  /** Description of the case (null if not provided) */
  description: string | null;
  /** The current status of the case */
  status: CaseStatus;
  /** Due date for the case (null if not provided) */
  dueDate: Date | null;
  /** Timestamp when the case was created */
  createdAt: Date;
  /** Timestamp when the case was last updated */
  updatedAt: Date;
}
