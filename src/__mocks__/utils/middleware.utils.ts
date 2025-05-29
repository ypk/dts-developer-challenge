import { Application } from 'express';
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';

/**
 * Safely applies middleware to an Express application with error handling and logging.
 * @param {Application} app - The Express application instance
 * @param {string} name - The name of the middleware for logging purposes
 * @param {() => void} fn - The middleware function to be applied
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

/**
 * Retrieves the contents of an SVG file from a mock path.
 * @param {string} filename - The name of the SVG file to read
 * @returns {string} The contents of the SVG file or an empty string if an error occurs
 */
export const getSVG = (filename: string): string => {
  try {
    const mockPath = path.join('/mock/path', filename);
    return fs.readFileSync(mockPath, 'utf8');
  } catch (error) {
    console.error(`Error reading SVG file: ${filename}`, error);
    return '';
  }
};

/**
 * Formats a status string by converting it from snake_case to Title Case.
 * @param {string} text - The input status string
 * @returns {string} The formatted status string or an empty string if input is empty
 */
export const formatStatus = (text: string): string => {
  if (!text) return '';

  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
