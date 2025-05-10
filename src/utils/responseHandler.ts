import { Response } from 'express';
import { IResponseHandler } from '../interfaces/IResponseHandler.ts';

/**
 * Implementation of the response handler utilities interface
 */
export class ResponseHandler implements IResponseHandler {
  /**
   * Send a success response
   * @param res Express response object
   * @param data Data to send in the response
   * @param statusCode HTTP status code (defaults to 200)
   */
  public sendSuccess(res: Response, data: any, statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      ...data,
    });
  }

  /**
   * Send a success response with no content (204)
   * @param res Express response object
   */
  public sendNoContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send an error response
   * @param res Express response object
   * @param message Error message
   * @param error Original error object or message
   * @param statusCode HTTP status code (defaults to 500)
   */
  public sendError(res: Response, message: string, error: unknown, statusCode = 500): void {
    console.error(`Error: ${message}`, error);

    res.status(statusCode).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  /**
   * Send a bad request error response (400)
   * @param res Express response object
   * @param message Error message
   */
  public sendBadRequest(res: Response, message: string): void {
    res.status(400).json({
      success: false,
      message,
    });
  }
}

const responseHandlerInstance = new ResponseHandler();

// For backward compatibility
export const sendSuccess = responseHandlerInstance.sendSuccess;
export const sendNoContent = responseHandlerInstance.sendNoContent;
export const sendError = responseHandlerInstance.sendError;
export const sendBadRequest = responseHandlerInstance.sendBadRequest;
