jest.mock('log-symbols', () => ({
  success: '✓',
  error: '✖',
  info: 'ℹ',
  warning: '⚠',
}));

import { safelyApplyMiddleware, MiddlewareUtils } from '../../utils/middleware.utils.ts';
import { IMiddlewareUtils } from '../../interfaces/IMiddlewareUtils';
import { Application } from 'express';

describe('middleware.utils', () => {
  let mockApp: Partial<Application>;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let middlewareUtils: IMiddlewareUtils;

  beforeEach(() => {
    mockApp = {};
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    middlewareUtils = new MiddlewareUtils();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('MiddlewareUtils class', () => {
    it('should execute the middleware function successfully', () => {
      const middlewareName = 'Test Middleware';
      const mockFn = jest.fn();

      middlewareUtils.safelyApplyMiddleware(mockApp as Application, middlewareName, mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith('✓', expect.stringContaining(middlewareName));
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle errors when middleware function throws', () => {
      const middlewareName = 'Error Middleware';
      const errorMessage = 'Middleware error';
      const mockFn = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      middlewareUtils.safelyApplyMiddleware(mockApp as Application, middlewareName, mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '✖',
        expect.stringContaining(middlewareName),
        errorMessage,
      );
    });

    it('should handle non-Error objects thrown by middleware', () => {
      const middlewareName = 'String Error Middleware';
      const mockFn = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      middlewareUtils.safelyApplyMiddleware(mockApp as Application, middlewareName, mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '✖',
        expect.stringContaining(middlewareName),
        'Unknown error',
      );
    });
  });

  describe('Exported function', () => {
    it('should execute the middleware function successfully', () => {
      const middlewareName = 'Test Middleware';
      const mockFn = jest.fn();

      safelyApplyMiddleware(mockApp as Application, middlewareName, mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith('✓', expect.stringContaining(middlewareName));
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle errors when middleware function throws', () => {
      const middlewareName = 'Error Middleware';
      const errorMessage = 'Middleware error';
      const mockFn = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      safelyApplyMiddleware(mockApp as Application, middlewareName, mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '✖',
        expect.stringContaining(middlewareName),
        errorMessage,
      );
    });
  });
});
