import { CaseStatus } from '../lib/prisma.ts';

/**
 * Interface for creating a new case
 */
export interface ICreateCaseDto {
  /**
   * The title of the case
   */
  title: string;

  /**
   * Optional description of the case
   */
  description?: string;

  /**
   * Optional status of the case (defaults to PENDING if not provided)
   */
  status?: CaseStatus;

  /**
   * Optional due date for the case
   */
  dueDate?: Date | string;
}

/**
 * Interface for updating an existing case
 */
export interface IUpdateCaseDto {
  /**
   * Optional updated title
   */
  title?: string;

  /**
   * Optional updated description
   */
  description?: string;

  /**
   * Optional updated status
   */
  status?: CaseStatus;

  /**
   * Optional updated due date
   */
  dueDate?: Date | string;
}

/**
 * Interface for updating only the status of a case
 */
export interface IUpdateCaseStatusDto {
  /**
   * The new status for the case
   */
  status: CaseStatus;
}

/**
 * Interface for case response data
 */
export interface ICaseResponseDto {
  /**
   * The unique identifier of the case
   */
  id: number;

  /**
   * The title of the case
   */
  title: string;

  /**
   * The description of the case (can be null)
   */
  description: string | null;

  /**
   * The current status of the case
   */
  status: CaseStatus;

  /**
   * The due date for the case (can be null)
   */
  dueDate: Date | null;

  /**
   * When the case was created
   */
  createdAt: Date;

  /**
   * When the case was last updated
   */
  updatedAt: Date;
}
