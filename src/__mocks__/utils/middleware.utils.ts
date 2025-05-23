import { Application } from 'express';
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';

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

export const getSVG = (filename: string): string => {
  try {
    const mockPath = path.join('/mock/path', filename);
    return fs.readFileSync(mockPath, 'utf8');
  } catch (error) {
    console.error(`Error reading SVG file: ${filename}`, error);
    return '';
  }
};

export const formatStatus = (text: string): string => {
  if (!text) return '';

  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
