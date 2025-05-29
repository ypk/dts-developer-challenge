import { Application } from 'express';
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { safelyApplyMiddleware, getSVG, formatStatus } from '../../utils/middleware.utils.js';

jest.mock('fs');
jest.mock('path');
jest.mock('log-symbols', () => ({
  success: '✓',
  error: '✗',
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('middleware.utils', () => {
  let mockApp: Partial<Application>;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp = { use: jest.fn() };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('safelyApplyMiddleware', () => {
    it('should apply middleware successfully', () => {
      const middlewareFunction = jest.fn();

      safelyApplyMiddleware(mockApp as Application, 'test', middlewareFunction);

      expect(middlewareFunction).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        logSymbols.success,
        ' test middleware applied successfully',
      );
    });

    it('should handle Error exceptions', () => {
      const middlewareFunction = jest.fn(() => {
        throw new Error('Test error');
      });

      safelyApplyMiddleware(mockApp as Application, 'test', middlewareFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        logSymbols.error,
        ' Error applying test middleware:',
        'Test error',
      );
    });

    it('should handle non-Error exceptions', () => {
      const middlewareFunction = jest.fn(() => {
        throw 'String error';
      });

      safelyApplyMiddleware(mockApp as Application, 'test', middlewareFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        logSymbols.error,
        ' Error applying test middleware:',
        'Unknown error',
      );
    });
  });

  describe('getSVG', () => {
    it('should read SVG file successfully', () => {
      const svgContent = '<svg></svg>';
      mockFs.readFileSync.mockReturnValue(svgContent);

      const result = getSVG('test.svg');

      expect(result).toBe(svgContent);
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'src/assets/images', 'test.svg');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        `${process.cwd()}/src/assets/images/test.svg`,
        'utf8',
      );
    });

    it('should handle file read errors', () => {
      const error = new Error('File not found');
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      const result = getSVG('missing.svg');

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading SVG file: missing.svg', error);
    });
  });

  describe('formatStatus', () => {
    it('should format status with underscores', () => {
      expect(formatStatus('in_progress')).toBe('In Progress');
    });

    it('should handle empty input', () => {
      expect(formatStatus('')).toBe('');
    });

    it('should handle null input', () => {
      expect(formatStatus(null as any)).toBe('');
    });

    it('should handle single word', () => {
      expect(formatStatus('pending')).toBe('Pending');
    });

    it('should handle mixed case', () => {
      expect(formatStatus('COMPLETED_SUCCESSFULLY')).toBe('Completed Successfully');
    });
  });
});
