import {
  ICreateCaseDto,
  IUpdateCaseDto,
  IUpdateCaseStatusDto,
  ICaseResponseDto,
} from '../interfaces/ICaseDTO.ts';

/**
 * Data transfer object for creating a new case
 */
export type CreateCaseDto = ICreateCaseDto;

/**
 * Data transfer object for updating an existing case
 */
export type UpdateCaseDto = IUpdateCaseDto;

/**
 * Data transfer object for updating only the status of a case
 */
export type UpdateCaseStatusDto = IUpdateCaseStatusDto;

/**
 * Data transfer object for case response data
 */
export type CaseResponseDto = ICaseResponseDto;
