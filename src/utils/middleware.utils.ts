import { Application } from 'express';
import logSymbols from 'log-symbols';
import { IMiddlewareUtils } from '../interfaces/IMiddlewareUtils.ts';

/**
 * Implementation of middleware utilities
 */
export class MiddlewareUtils implements IMiddlewareUtils {
  /**
   * Helper function to safely apply middleware with error handling
   * @param app Express application instance
   * @param name Name of the middleware for logging
   * @param fn Function that applies the middleware
   */
  public safelyApplyMiddleware(app: Application, name: string, fn: () => void): void {
    try {
      fn();
      console.log(logSymbols.success, ` ${name} middleware applied successfully`);
    } catch (error) {
      console.error(
        logSymbols.error,
        ` Error applying ${name} middleware:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}

const middlewareUtilsInstance = new MiddlewareUtils();

// For backward compatibility
/**
 * Helper function to safely apply middleware with error handling
 * @param app Express application instance
 * @param name Name of the middleware for logging
 * @param fn Function that applies the middleware
 */
export const safelyApplyMiddleware = (app: Application, name: string, fn: () => void): void => {
  middlewareUtilsInstance.safelyApplyMiddleware(app, name, fn);
};
