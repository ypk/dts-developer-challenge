import { Request, Response } from 'express';
import { sendError, sendBadRequest } from '../utils/responseHandler.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';
import { ICaseHelper } from '../interfaces/ICaseHelper.ts';
import { IResponseHandler } from '../interfaces/IResponseHandler.ts';

/**
 * Implementation of case helper utilities
 */
export class CaseHelper implements ICaseHelper {
  private responseHandler: IResponseHandler;

  constructor(responseHandler: IResponseHandler) {
    this.responseHandler = responseHandler;
  }

  /**
   * Validates and parses a case ID from request parameters
   * @param req Express request object
   * @param res Express response object
   * @returns Parsed ID as number or null if invalid
   */
  public validateAndParseId(req: Request, res: Response): number | null {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      this.responseHandler.sendBadRequest(res, 'Invalid case ID');
      return null;
    }

    return id;
  }

  /**
   * Handles NotFoundError by sending appropriate response
   * @param error Error to check
   * @param res Express response object
   * @returns True if error was handled, false otherwise
   */
  public handleNotFoundError(error: unknown, res: Response): boolean {
    if (error instanceof NotFoundError) {
      this.responseHandler.sendError(res, error.message, error, 404);
      return true;
    }
    return false;
  }
}

// For backward compatibility
export const validateAndParseId = (req: Request, res: Response): number | null => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    sendBadRequest(res, 'Invalid case ID');
    return null;
  }

  return id;
};

export const handleNotFoundError = (error: unknown, res: Response): boolean => {
  if (error instanceof NotFoundError) {
    sendError(res, error.message, error, 404);
    return true;
  }
  return false;
};
