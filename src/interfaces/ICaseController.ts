import { Request, Response } from 'express';

/**
 * Interface for case controller operations
 */
export interface ICaseController {
  /**
   * Get all cases with optional pagination
   * @param req Express request object
   * @param res Express response object
   */
  getAllCases(req: Request, res: Response): Promise<void>;

  /**
   * Get a case by its ID
   * @param req Express request object with case ID parameter
   * @param res Express response object
   */
  getCaseById(req: Request, res: Response): Promise<void>;

  /**
   * Create a new case
   * @param req Express request object with case data in body
   * @param res Express response object
   */
  createCase(req: Request, res: Response): Promise<void>;

  /**
   * Update an existing case
   * @param req Express request object with case ID parameter and updated data in body
   * @param res Express response object
   */
  updateCase(req: Request, res: Response): Promise<void>;

  /**
   * Update only the status of a case
   * @param req Express request object with case ID parameter and status in body
   * @param res Express response object
   */
  updateCaseStatus(req: Request, res: Response): Promise<void>;

  /**
   * Delete a case
   * @param req Express request object with case ID parameter
   * @param res Express response object
   */
  deleteCase(req: Request, res: Response): Promise<void>;
}
