import { Response } from 'express';

/**
 * Interface for error handling functionality
 */
export interface IErrorHandler {
  /**
   * Handle and format error responses
   * @param res Express response object
   * @param message Error message
   * @param error Original error object or message
   * @param statusCode HTTP status code (defaults to 500)
   */
  handleError(res: Response, message: string, error: unknown, statusCode?: number): void;

  /**
   * Format error details for logging and response
   * @param error Error object or message
   * @returns Formatted error message
   */
  formatError(error: unknown): string;

  /**
   * Determine appropriate status code based on error type
   * @param error Error object
   * @returns HTTP status code
   */
  getStatusCode(error: unknown): number;
}
