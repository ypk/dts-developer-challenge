import { Response } from 'express';

/**
 * Interface for response handling functionality
 */
export interface IResponseHandler {
  /**
   * Send a success response
   * @param res Express response object
   * @param data Data to send in the response
   * @param statusCode HTTP status code (defaults to 200)
   */
  sendSuccess(res: Response, data: any, statusCode?: number): void;

  /**
   * Send a success response with no content (204)
   * @param res Express response object
   */
  sendNoContent(res: Response): void;

  /**
   * Send an error response
   * @param res Express response object
   * @param message Error message
   * @param error Original error object or message
   * @param statusCode HTTP status code (defaults to 500)
   */
  sendError(res: Response, message: string, error: unknown, statusCode?: number): void;

  /**
   * Send a bad request error response (400)
   * @param res Express response object
   * @param message Error message
   */
  sendBadRequest(res: Response, message: string): void;
}
