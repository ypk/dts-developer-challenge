import { Response } from 'express';
import { IErrorHandler } from '../interfaces/IErrorHandler.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';

/**
 * Implementation of error handling functionality
 */
export class ErrorHandler implements IErrorHandler {
  /**
   * Handle and format error responses
   * @param res Express response object
   * @param message Error message
   * @param error Original error object or message
   * @param statusCode HTTP status code (defaults to 500)
   */
  public handleError(res: Response, message: string, error: unknown, statusCode?: number): void {
    const formattedError = this.formatError(error);
    const code = statusCode || this.getStatusCode(error);

    console.error(`Error: ${message}`, formattedError);

    res.status(code).json({
      success: false,
      message,
      error: formattedError,
    });
  }

  /**
   * Format error details for logging and response
   * @param error Error object or message
   * @returns Formatted error message
   */
  public formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }

  /**
   * Determine appropriate status code based on error type
   * @param error Error object
   * @returns HTTP status code
   */
  public getStatusCode(error: unknown): number {
    if (error instanceof NotFoundError) {
      return 404;
    }
    // Add more error types and status codes as needed
    return 500;
  }
}

// Create a singleton instance
export const errorHandlerInstance = new ErrorHandler();

// For backward compatibility
export const handleError = (
  res: Response,
  message: string,
  error: unknown,
  statusCode?: number,
): void => {
  errorHandlerInstance.handleError(res, message, error, statusCode);
};

export const formatError = (error: unknown): string => {
  return errorHandlerInstance.formatError(error);
};

export const getStatusCode = (error: unknown): number => {
  return errorHandlerInstance.getStatusCode(error);
};
