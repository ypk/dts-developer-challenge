import { Request, Response } from 'express';

/**
 * Interface for case helper utilities
 */
export interface ICaseHelper {
  /**
   * Validates and parses a case ID from request parameters
   * @param req Express request object
   * @param res Express response object
   * @returns Parsed ID as number or null if invalid
   */
  validateAndParseId(req: Request, res: Response): number | null;

  /**
   * Handles NotFoundError by sending appropriate response
   * @param error Error to check
   * @param res Express response object
   * @returns True if error was handled, false otherwise
   */
  handleNotFoundError(error: unknown, res: Response): boolean;
}
