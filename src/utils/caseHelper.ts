/**
 * Utility functions for case-related operations
 * @module utils/caseHelper
 */

import { Request, Response } from 'express';
import { sendError, sendBadRequest } from '../utils/responseHandler.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';

/**
 * Validates and parses a case ID from request parameters
 *
 * @param {Request} req - Express request object containing the ID parameter
 * @param {Response} res - Express response object for sending error responses
 * @returns {number|null} The parsed ID as a number, or null if invalid
 */
export const validateAndParseId = (req: Request, res: Response): number | null => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    sendBadRequest(res, 'Invalid case ID');
    return null;
  }

  return id;
};

/**
 * Handles NotFoundError exceptions by sending appropriate error responses
 *
 * @param {unknown} error - The error to check
 * @param {Response} res - Express response object for sending error responses
 * @returns {boolean} True if the error was a NotFoundError and was handled, false otherwise
 */
export const handleNotFoundError = (error: unknown, res: Response): boolean => {
  if (error instanceof NotFoundError) {
    sendError(res, error.message, error, 404);
    return true;
  }
  return false;
};
