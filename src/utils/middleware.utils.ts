/**
 * Utility functions for middleware application and management
 * @module utils/middleware.utils
 */

 
import { Application } from 'express';
import logSymbols from 'log-symbols';

/**
 * Helper function to safely apply middleware with error handling
 * Provides consistent logging and prevents application crashes during middleware setup
 *
 * @param {Application} app - Express application instance
 * @param {string} name - Name of the middleware for logging
 * @param {Function} fn - Function that applies the middleware
 * @returns {void}
 */
export const safelyApplyMiddleware = (app: Application, name: string, fn: () => void): void => {
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
};
