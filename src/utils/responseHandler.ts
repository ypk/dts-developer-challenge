/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';

/**
 * Send a success response
 * @param res Express response object
 * @param data Data to send in the response
 * @param statusCode HTTP status code (defaults to 200)
 */
export const sendSuccess = (res: Response, data: any, statusCode = 200): void => {
  res.status(statusCode).json({
    success: true,
    ...data,
  });
};

/**
 * Send a success response with no content (204)
 * @param res Express response object
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

/**
 * Send an error response
 * @param res Express response object
 * @param message Error message
 * @param error Original error object or message
 * @param statusCode HTTP status code (defaults to 500)
 */
export const sendError = (
  res: Response,
  message: string,
  error: unknown,
  statusCode = 500,
): void => {
  console.error(`Error: ${message}`, error);

  res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
};

/**
 * Send a bad request error response (400)
 * @param res Express response object
 * @param message Error message
 */
export const sendBadRequest = (res: Response, message: string): void => {
  res.status(400).json({
    success: false,
    message,
  });
};
