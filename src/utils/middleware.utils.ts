/* eslint-disable no-console */
import { Application } from 'express';
import logSymbols from 'log-symbols';

/**
 * Helper function to safely apply middleware with error handling
 * @param app Express application instance
 * @param name Name of the middleware for logging
 * @param fn Function that applies the middleware
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
