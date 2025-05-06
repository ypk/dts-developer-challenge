import { Request, Response } from 'express';
import { sendError, sendBadRequest } from '../utils/responseHandler.ts';
import { NotFoundError } from './errorHandler.ts';

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
