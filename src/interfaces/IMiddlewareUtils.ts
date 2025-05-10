import { Application } from 'express';

/**
 * Interface for middleware utilities
 */
export interface IMiddlewareUtils {
  /**
   * Helper function to safely apply middleware with error handling
   * @param app Express application instance
   * @param name Name of the middleware for logging
   * @param fn Function that applies the middleware
   */
  safelyApplyMiddleware(app: Application, name: string, fn: () => void): void;
}
