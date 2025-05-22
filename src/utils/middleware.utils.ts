/**
 * Utility functions for middleware application and management
 * @module utils/middleware.utils
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Application } from 'express';
import logSymbols from 'log-symbols';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Reads an SVG file from the assets directory and returns its contents as a string
 *
 * @param {string} filename - The name of the SVG file to read
 * @returns {string} The contents of the SVG file, or an empty string if the file cannot be read
 */
export const getSVG = (filename: string): string => {
  const svgPath = path.join(__dirname, '../../src/assets/images', filename);

  try {
    return fs.readFileSync(svgPath, 'utf8');
  } catch (error) {
    console.error(`Error reading SVG file: ${filename}`, error);
    return '';
  }
};

/**
 * Formats a string by replacing underscores with spaces and capitalizing each word
 * @param {string} text - The text to format
 * @returns {string} The formatted text
 */
export const formatStatus = (text: string): string => {
  if (!text) return '';

  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
