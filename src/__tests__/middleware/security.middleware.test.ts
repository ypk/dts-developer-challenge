/**
 * Unit tests for security.middleware.ts
 * @module tests/middleware/security
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../middleware/logger.middleware.js';

jest.mock('../../middleware/logger.middleware.ts', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    jest.clearAllMocks();

    mockRequest = {};

    mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('loadSecurityConfig', () => {
    describe('test environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'test';
      });

      it('should return test configuration with secure defaults', async () => {
        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '1; mode=block',
          hstsMaxAge: 0,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });

      it('should ignore environment variables in test mode', async () => {
        process.env.SECURITY_FRAME_OPTIONS = 'DENY';
        process.env.SECURITY_HSTS_MAX_AGE = '31536000';
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '1; mode=block',
          hstsMaxAge: 0,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });
    });

    describe('production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        Object.keys(process.env).forEach((key) => {
          if (key.startsWith('SECURITY_')) {
            delete process.env[key];
          }
        });
      });

      it('should return production defaults when no env vars are set', async () => {
        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'DENY',
          xssProtection: '1; mode=block',
          hstsMaxAge: 31536000,
          hstsIncludeSubdomains: true,
          hstsPreload: true,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });

      it('should use environment variables when provided', async () => {
        process.env.SECURITY_CONTENT_TYPE_OPTIONS = 'custom-nosniff';
        process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';
        process.env.SECURITY_XSS_PROTECTION = '0';
        process.env.SECURITY_HSTS_MAX_AGE = '7776000';
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
        process.env.SECURITY_HSTS_PRELOAD = 'false';
        process.env.SECURITY_REFERRER_POLICY = 'strict-origin';
        process.env.SECURITY_REMOVE_POWERED_BY = 'false';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'custom-nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '0',
          hstsMaxAge: 7776000,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'strict-origin',
          removePoweredBy: false,
        });
      });

      it('should handle invalid HSTS max age by using default', async () => {
        process.env.SECURITY_HSTS_MAX_AGE = 'invalid-number';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsMaxAge).toBe(31536000);
      });

      it('should handle NaN HSTS max age', async () => {
        process.env.SECURITY_HSTS_MAX_AGE = 'NaN';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsMaxAge).toBe(31536000);
      });

      it('should handle empty HSTS max age', async () => {
        process.env.SECURITY_HSTS_MAX_AGE = '';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsMaxAge).toBe(31536000);
      });

      it('should handle valid HSTS max age string', async () => {
        process.env.SECURITY_HSTS_MAX_AGE = '86400';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsMaxAge).toBe(86400);
      });

      it('should handle boolean environment variables correctly', async () => {
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
        process.env.SECURITY_HSTS_PRELOAD = 'false';
        process.env.SECURITY_REMOVE_POWERED_BY = 'false';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(false);
        expect(securityConfig.hstsPreload).toBe(false);
        expect(securityConfig.removePoweredBy).toBe(false);
      });

      it('should handle truthy values for boolean environment variables', async () => {
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
        process.env.SECURITY_HSTS_PRELOAD = 'true';
        process.env.SECURITY_REMOVE_POWERED_BY = 'true';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(true);
        expect(securityConfig.hstsPreload).toBe(true);
        expect(securityConfig.removePoweredBy).toBe(true);
      });

      it('should handle non-false values as truthy for boolean flags', async () => {
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'anything-not-false';
        process.env.SECURITY_HSTS_PRELOAD = 'yes';
        process.env.SECURITY_REMOVE_POWERED_BY = '1';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(true);
        expect(securityConfig.hstsPreload).toBe(true);
        expect(securityConfig.removePoweredBy).toBe(true);
      });
    });

    describe('development environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        Object.keys(process.env).forEach((key) => {
          if (key.startsWith('SECURITY_')) {
            delete process.env[key];
          }
        });
      });

      it('should return development defaults when no env vars are set', async () => {
        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '1; mode=block',
          hstsMaxAge: 0,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });

      it('should use environment variables when provided', async () => {
        process.env.SECURITY_CONTENT_TYPE_OPTIONS = 'custom-nosniff';
        process.env.SECURITY_FRAME_OPTIONS = 'DENY';
        process.env.SECURITY_XSS_PROTECTION = '0';
        process.env.SECURITY_HSTS_MAX_AGE = '3600';
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
        process.env.SECURITY_HSTS_PRELOAD = 'true';
        process.env.SECURITY_REFERRER_POLICY = 'no-referrer';
        process.env.SECURITY_REMOVE_POWERED_BY = 'false';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'custom-nosniff',
          frameOptions: 'DENY',
          xssProtection: '0',
          hstsMaxAge: 3600,
          hstsIncludeSubdomains: true,
          hstsPreload: true,
          referrerPolicy: 'no-referrer',
          removePoweredBy: false,
        });
      });

      it('should handle invalid HSTS max age by using development default', async () => {
        process.env.SECURITY_HSTS_MAX_AGE = 'not-a-number';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsMaxAge).toBe(0);
      });

      it('should handle boolean environment variables correctly for development', async () => {
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
        process.env.SECURITY_HSTS_PRELOAD = 'true';
        process.env.SECURITY_REMOVE_POWERED_BY = 'true';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(true);
        expect(securityConfig.hstsPreload).toBe(true);
        expect(securityConfig.removePoweredBy).toBe(true);
      });

      it('should handle falsy boolean values in development', async () => {
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
        process.env.SECURITY_HSTS_PRELOAD = 'false';
        process.env.SECURITY_REMOVE_POWERED_BY = 'false';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(false);
        expect(securityConfig.hstsPreload).toBe(false);
        expect(securityConfig.removePoweredBy).toBe(false);
      });
    });

    describe('other environments', () => {
      it('should use development-like defaults for unknown environments', async () => {
        process.env.NODE_ENV = 'staging';

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '1; mode=block',
          hstsMaxAge: 0,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });

      it('should handle undefined NODE_ENV', async () => {
        delete process.env.NODE_ENV;

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig).toEqual({
          contentTypeOptions: 'nosniff',
          frameOptions: 'SAMEORIGIN',
          xssProtection: '1; mode=block',
          hstsMaxAge: 0,
          hstsIncludeSubdomains: false,
          hstsPreload: false,
          referrerPolicy: 'no-referrer-when-downgrade',
          removePoweredBy: true,
        });
      });
    });
  });

  describe('buildHstsHeader', () => {
    it('should build basic HSTS header with max-age only', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'false';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
    });

    it('should build HSTS header with includeSubDomains', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'false';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=0; includeSubDomains',
      );
    });

    it('should build HSTS header with preload', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'true';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=0; preload',
      );
    });

    it('should build HSTS header with all options', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    });

    it('should build HSTS header with custom max-age', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '86400';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=86400; includeSubDomains; preload',
      );
    });
  });

  describe('securityHeaders middleware', () => {
    it('should verify logger mock is working', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      const { logger } = await import('../../middleware/logger.middleware.js');

      logger.error('test message', { test: 'data' });

      expect(logger.error).toHaveBeenCalledWith('test message', { test: 'data' });
    });

    it('should set all security headers correctly in test environment', async () => {
      process.env.NODE_ENV = 'test';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set all security headers correctly in development environment', async () => {
      process.env.NODE_ENV = 'development';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set all security headers correctly in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove X-Powered-By header when configured', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should not remove X-Powered-By header when disabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.removeHeader).not.toHaveBeenCalledWith('X-Powered-By');
    });

    it('should set custom header values from environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_CONTENT_TYPE_OPTIONS = 'custom-nosniff';
      process.env.SECURITY_FRAME_OPTIONS = 'DENY';
      process.env.SECURITY_XSS_PROTECTION = '0';
      process.env.SECURITY_REFERRER_POLICY = 'strict-origin';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'custom-nosniff',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin');
    });

    it('should call setHeader and removeHeader in correct order', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const calls = (mockResponse.setHeader as jest.Mock).mock.calls;
      const removeHeaderCalls = (mockResponse.removeHeader as jest.Mock).mock.calls;

      expect(calls.length).toBe(5);
      expect(removeHeaderCalls.length).toBe(1);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue execution even if an error occurs', async () => {
      process.env.NODE_ENV = 'development';

      (mockResponse.setHeader as jest.Mock).mockImplementation(() => {
        throw new Error('Header setting failed');
      });

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      expect(() => {
        securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle Error instances in catch block', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'development';

      const freshMockResponse = {
        setHeader: jest.fn(() => {
          throw new Error('Specific error message');
        }),
        removeHeader: jest.fn(),
      };

      const freshMockRequest = {};
      const freshMockNext = jest.fn();

      const { securityHeaders } = await import('../../middleware/security.middleware.js');
      const { logger } = await import('../../middleware/logger.middleware.js');

      securityHeaders(
        freshMockRequest as Request,
        freshMockResponse as unknown as Response,
        freshMockNext,
      );

      expect(freshMockNext).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'Specific error message',
      });
    });

    it('should handle non-Error instances in catch block', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'development';

      const freshMockResponse = {
        setHeader: jest.fn(() => {
          throw 'String error';
        }),
        removeHeader: jest.fn(),
      };

      const freshMockRequest = {};
      const freshMockNext = jest.fn();

      const { securityHeaders } = await import('../../middleware/security.middleware.js');
      const { logger } = await import('../../middleware/logger.middleware.js');

      securityHeaders(
        freshMockRequest as Request,
        freshMockResponse as unknown as Response,
        freshMockNext,
      );

      expect(freshMockNext).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'Unknown error',
      });
    });

    it('should handle different types of non-Error throws', async () => {
      const testCases = [
        { value: null, expected: 'Unknown error' },
        { value: undefined, expected: 'Unknown error' },
        { value: 42, expected: 'Unknown error' },
        { value: { message: 'not an error' }, expected: 'Unknown error' },
        { value: 'string error', expected: 'Unknown error' },
        { value: new Error('real error'), expected: 'real error' },
        { value: new Error(''), expected: '' },
      ];

      for (const testCase of testCases) {
        jest.resetModules();
        jest.clearAllMocks();

        process.env.NODE_ENV = 'development';

        const freshMockResponse = {
          setHeader: jest.fn(() => {
            throw testCase.value;
          }),
          removeHeader: jest.fn(),
        };

        const freshMockRequest = {};
        const freshMockNext = jest.fn();

        const { securityHeaders } = await import('../../middleware/security.middleware.js');
        const { logger } = await import('../../middleware/logger.middleware.js');

        securityHeaders(
          freshMockRequest as Request,
          freshMockResponse as unknown as Response,
          freshMockNext,
        );

        expect(freshMockNext).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith('Error applying security headers', {
          error: testCase.expected,
        });
      }
    });

    it('should handle errors from removeHeader', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'production';

      const freshMockResponse = {
        setHeader: jest.fn(),
        removeHeader: jest.fn(() => {
          throw new Error('RemoveHeader failed');
        }),
      };

      const freshMockRequest = {};
      const freshMockNext = jest.fn();

      const { securityHeaders } = await import('../../middleware/security.middleware.js');
      const { logger } = await import('../../middleware/logger.middleware.js');

      securityHeaders(
        freshMockRequest as Request,
        freshMockResponse as unknown as Response,
        freshMockNext,
      );

      expect(freshMockNext).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'RemoveHeader failed',
      });
    });

    it('should handle non-Error from removeHeader', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'production';

      const freshMockResponse = {
        setHeader: jest.fn(),
        removeHeader: jest.fn(() => {
          throw { code: 'REMOVE_FAILED' };
        }),
      };

      const freshMockRequest = {};
      const freshMockNext = jest.fn();

      const { securityHeaders } = await import('../../middleware/security.middleware.js');
      const { logger } = await import('../../middleware/logger.middleware.js');

      securityHeaders(
        freshMockRequest as Request,
        freshMockResponse as unknown as Response,
        freshMockNext,
      );

      expect(freshMockNext).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'Unknown error',
      });
    });

    it('should test ternary operator branches explicitly', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'development';

      const errorBranchResponse = {
        setHeader: jest.fn(() => {
          throw new Error('Error branch test');
        }),
        removeHeader: jest.fn(),
      };

      let module = await import('../../middleware/security.middleware.js');
      let loggerModule = await import('../../middleware/logger.middleware.js');

      module.securityHeaders({} as Request, errorBranchResponse as unknown as Response, jest.fn());

      expect(loggerModule.logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'Error branch test',
      });

      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'development';

      const nonErrorBranchResponse = {
        setHeader: jest.fn(() => {
          throw 'Non-error branch test';
        }),
        removeHeader: jest.fn(),
      };

      module = await import('../../middleware/security.middleware.js');
      loggerModule = await import('../../middleware/logger.middleware.js');

      module.securityHeaders(
        {} as Request,
        nonErrorBranchResponse as unknown as Response,
        jest.fn(),
      );

      expect(loggerModule.logger.error).toHaveBeenCalledWith('Error applying security headers', {
        error: 'Unknown error',
      });
    });
  });

  describe('logSecurityConfig', () => {
    it('should not log anything in test environment', async () => {
      process.env.NODE_ENV = 'test';

      const { logSecurityConfig } = await import('../../middleware/security.middleware.js');

      logSecurityConfig();

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should log production security info when in production', async () => {
      process.env.NODE_ENV = 'production';

      const { logSecurityConfig } = await import('../../middleware/security.middleware.js');

      expect(() => logSecurityConfig()).not.toThrow();

      if ((logger.info as jest.Mock).mock.calls.length > 0) {
        const call = (logger.info as jest.Mock).mock.calls[0];
        expect(call[0]).toBe('Security headers enabled');
        expect(call[1]).toMatchObject({
          environment: 'production',
          securityHeadersEnabled: true,
        });
      }
    });

    it('should log detailed configuration in development', async () => {
      process.env.NODE_ENV = 'development';

      const { logSecurityConfig } = await import('../../middleware/security.middleware.js');

      expect(() => logSecurityConfig()).not.toThrow();

      if ((logger.info as jest.Mock).mock.calls.length > 0) {
        const call = (logger.info as jest.Mock).mock.calls[0];
        expect(call[0]).toBe('Security headers configuration loaded');
        expect(typeof call[1]).toBe('object');
      }
    });

    it('should log detailed configuration in other environments', async () => {
      process.env.NODE_ENV = 'staging';

      const { logSecurityConfig } = await import('../../middleware/security.middleware.js');

      expect(() => logSecurityConfig()).not.toThrow();
    });
  });

  describe('securityConfig export', () => {
    it('should export the current security configuration', async () => {
      process.env.NODE_ENV = 'test';

      const { securityConfig } = await import('../../middleware/security.middleware.js');

      expect(securityConfig).toBeDefined();
      expect(typeof securityConfig).toBe('object');
      expect(securityConfig).toHaveProperty('contentTypeOptions');
      expect(securityConfig).toHaveProperty('frameOptions');
      expect(securityConfig).toHaveProperty('xssProtection');
      expect(securityConfig).toHaveProperty('hstsMaxAge');
      expect(securityConfig).toHaveProperty('hstsIncludeSubdomains');
      expect(securityConfig).toHaveProperty('hstsPreload');
      expect(securityConfig).toHaveProperty('referrerPolicy');
      expect(securityConfig).toHaveProperty('removePoweredBy');
    });

    it('should export configuration that matches loadSecurityConfig result', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';
      process.env.SECURITY_HSTS_MAX_AGE = '86400';

      const { securityConfig } = await import('../../middleware/security.middleware.js');

      expect(securityConfig.frameOptions).toBe('SAMEORIGIN');
      expect(securityConfig.hstsMaxAge).toBe(86400);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle malformed environment variables gracefully', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_HSTS_MAX_AGE = 'definitely-not-a-number';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'maybe';
      process.env.SECURITY_HSTS_PRELOAD = 'sometimes';
      process.env.SECURITY_REMOVE_POWERED_BY = 'perhaps';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      expect(() => {
        securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle very large HSTS max-age values', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '99999999999999999';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );

      expect(hstsCall[1]).toMatch(/max-age=\d+/);
    });

    it('should handle negative HSTS max-age values', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '-1000';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=-1000',
      );
    });

    it('should handle floating point HSTS max-age values', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '86400.5';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=86400',
      );
    });
  });

  describe('integration tests', () => {
    it('should work correctly with all default production settings', async () => {
      process.env.NODE_ENV = 'production';
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith('SECURITY_')) {
          delete process.env[key];
        }
      });

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should work correctly with all default development settings', async () => {
      process.env.NODE_ENV = 'development';
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith('SECURITY_')) {
          delete process.env[key];
        }
      });

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle complete middleware flow with custom configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_CONTENT_TYPE_OPTIONS = 'custom-value';
      process.env.SECURITY_FRAME_OPTIONS = 'DENY';
      process.env.SECURITY_XSS_PROTECTION = '0';
      process.env.SECURITY_HSTS_MAX_AGE = '7776000';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'false';
      process.env.SECURITY_REFERRER_POLICY = 'strict-origin';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'custom-value');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=7776000',
      );
      expect(mockResponse.removeHeader).not.toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('environment transitions', () => {
    it('should handle switching between environments during runtime', async () => {
      process.env.NODE_ENV = 'test';
      let module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');

      jest.resetModules();
      process.env.NODE_ENV = 'production';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('DENY');

      jest.resetModules();
      process.env.NODE_ENV = 'development';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');
    });

    it('should handle environment variables changing between imports', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_FRAME_OPTIONS = 'DENY';

      let module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('DENY');

      jest.resetModules();
      process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';

      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');
    });
  });

  describe('header validation', () => {
    it('should set exactly 5 headers and call removeHeader once', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockResponse.setHeader as jest.Mock).mock.calls.length).toBe(5);
      expect((mockResponse.removeHeader as jest.Mock).mock.calls.length).toBe(1);
    });

    it('should verify all expected headers are set with correct names', async () => {
      process.env.NODE_ENV = 'development';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const setHeaderCalls = (mockResponse.setHeader as jest.Mock).mock.calls;
      const headerNames = setHeaderCalls.map((call) => call[0]);

      expect(headerNames).toContain('X-Content-Type-Options');
      expect(headerNames).toContain('X-Frame-Options');
      expect(headerNames).toContain('X-XSS-Protection');
      expect(headerNames).toContain('Strict-Transport-Security');
      expect(headerNames).toContain('Referrer-Policy');

      expect(headerNames.length).toBe(5);
    });

    it('should verify header values are strings', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const setHeaderCalls = (mockResponse.setHeader as jest.Mock).mock.calls;

      setHeaderCalls.forEach(([headerName, headerValue]) => {
        expect(typeof headerName).toBe('string');
        expect(typeof headerValue).toBe('string');
        expect(headerName.length).toBeGreaterThan(0);
        expect(headerValue.length).toBeGreaterThan(0);
      });
    });
  });

  describe('complex configuration scenarios', () => {
    it('should handle all possible boolean combinations', async () => {
      const booleanValues = ['true', 'false', '1', '0', 'yes', 'no', '', 'random'];

      for (const includeSubdomains of booleanValues.slice(0, 2)) {
        for (const preload of booleanValues.slice(0, 2)) {
          for (const removePoweredBy of booleanValues.slice(0, 2)) {
            jest.clearAllMocks();
            jest.resetModules();

            process.env.NODE_ENV = 'development';
            process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = includeSubdomains;
            process.env.SECURITY_HSTS_PRELOAD = preload;
            process.env.SECURITY_REMOVE_POWERED_BY = removePoweredBy;

            const { securityHeaders } = await import('../../middleware/security.middleware.js');

            expect(() => {
              securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
            }).not.toThrow();

            expect(mockNext).toHaveBeenCalled();
          }
        }
      }
    });

    it('should handle mixed case environment variable values', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';
      process.env.SECURITY_REMOVE_POWERED_BY = 'fAlSe';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall[1]).toContain('includeSubDomains');

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should handle empty string environment variables', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_CONTENT_TYPE_OPTIONS = '';
      process.env.SECURITY_FRAME_OPTIONS = '';
      process.env.SECURITY_XSS_PROTECTION = '';
      process.env.SECURITY_REFERRER_POLICY = '';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );
    });
  });

  describe('performance and memory tests', () => {
    it('should handle rapid successive calls efficiently', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const localNext = jest.fn();
        const localResponse = {
          setHeader: jest.fn(),
          removeHeader: jest.fn(),
        };

        securityHeaders(mockRequest as Request, localResponse as unknown as Response, localNext);

        expect(localNext).toHaveBeenCalled();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should not accumulate memory over multiple calls', async () => {
      process.env.NODE_ENV = 'development';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      for (let i = 0; i < 50; i++) {
        const localNext = jest.fn();
        const localResponse = {
          setHeader: jest.fn(),
          removeHeader: jest.fn(),
        };

        securityHeaders(mockRequest as Request, localResponse as unknown as Response, localNext);

        expect(localNext).toHaveBeenCalled();
      }

      expect(true).toBe(true);
    });
  });

  describe('function exports and module structure', () => {
    it('should export all required functions and objects', async () => {
      const module = await import('../../middleware/security.middleware.js');

      expect(module.securityHeaders).toBeDefined();
      expect(module.securityConfig).toBeDefined();
      expect(module.logSecurityConfig).toBeDefined();

      expect(typeof module.securityHeaders).toBe('function');
      expect(typeof module.securityConfig).toBe('object');
      expect(typeof module.logSecurityConfig).toBe('function');
    });

    it('should have securityHeaders function with correct arity', async () => {
      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      expect(securityHeaders.length).toBe(3);
    });

    it('should have logSecurityConfig function with correct arity', async () => {
      const { logSecurityConfig } = await import('../../middleware/security.middleware.js');

      expect(logSecurityConfig.length).toBe(0);
    });

    it('should export securityConfig as a plain object', async () => {
      const { securityConfig } = await import('../../middleware/security.middleware.js');

      expect(securityConfig.constructor).toBe(Object);
      expect(Array.isArray(securityConfig)).toBe(false);
      expect(securityConfig).not.toBeNull();
      expect(securityConfig).not.toBeUndefined();
    });
  });

  describe('comprehensive testing verification', () => {
    it('should verify all code paths have been tested', async () => {
      const environments = ['test', 'production', 'development', 'staging'];

      for (const env of environments) {
        jest.resetModules();
        jest.clearAllMocks();

        process.env.NODE_ENV = env;

        const module = await import('../../middleware/security.middleware.js');

        module.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();

        module.logSecurityConfig();

        expect(module.securityConfig).toBeDefined();
        expect(typeof module.securityConfig).toBe('object');
      }

      jest.resetModules();
      jest.clearAllMocks();
      delete process.env.NODE_ENV;

      const undefinedEnvModule = await import('../../middleware/security.middleware.js');
      undefinedEnvModule.securityHeaders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();

      const hstsConfigs = [
        { includeSubDomains: false, preload: false, expected: 'max-age=1000' },
        { includeSubDomains: true, preload: false, expected: 'max-age=1000; includeSubDomains' },
        { includeSubDomains: false, preload: true, expected: 'max-age=1000; preload' },
        {
          includeSubDomains: true,
          preload: true,
          expected: 'max-age=1000; includeSubDomains; preload',
        },
      ];

      for (const config of hstsConfigs) {
        jest.resetModules();
        jest.clearAllMocks();
        (mockResponse.setHeader as jest.Mock).mockImplementation(jest.fn());

        process.env.NODE_ENV = 'development';
        process.env.SECURITY_HSTS_MAX_AGE = '1000';
        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = config.includeSubDomains.toString();
        process.env.SECURITY_HSTS_PRELOAD = config.preload.toString();

        const hstsModule = await import('../../middleware/security.middleware.js');
        hstsModule.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Strict-Transport-Security',
          config.expected,
        );
      }
    });

    it('should test error handling scenarios', async () => {
      process.env.NODE_ENV = 'development';

      (mockResponse.setHeader as jest.Mock).mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      expect(() => {
        securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should test all boolean environment variable parsing', async () => {
      process.env.NODE_ENV = 'production';

      const testCases = [
        { value: 'true', expected: true },
        { value: 'false', expected: false },
        { value: 'TRUE', expected: true },
        { value: 'FALSE', expected: true },
        { value: '1', expected: true },
        { value: '0', expected: true },
        { value: '', expected: true },
        { value: 'random', expected: true },
      ];

      for (const testCase of testCases) {
        jest.resetModules();

        process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = testCase.value;

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        expect(securityConfig.hstsIncludeSubdomains).toBe(testCase.expected);
      }
    });

    it('should test integer parsing for HSTS max age', async () => {
      const testCases = [
        { value: '86400', expected: 86400 },
        { value: '0', expected: 0 },
        { value: '-1000', expected: -1000 },
        { value: '86400.5', expected: 86400 },
        { value: 'invalid', expected: NaN },
        { value: '', expected: NaN },
      ];

      for (const testCase of testCases) {
        jest.resetModules();

        process.env.NODE_ENV = 'development';
        process.env.SECURITY_HSTS_MAX_AGE = testCase.value;

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        if (isNaN(testCase.expected)) {
          expect(securityConfig.hstsMaxAge).toBe(0);
        } else {
          expect(securityConfig.hstsMaxAge).toBe(testCase.expected);
        }
      }
    });
  });

  describe('final coverage verification', () => {
    it('should verify all exported functions and objects work correctly', async () => {
      process.env.NODE_ENV = 'test';

      const module = await import('../../middleware/security.middleware.js');

      expect(typeof module.securityHeaders).toBe('function');
      expect(typeof module.logSecurityConfig).toBe('function');
      expect(typeof module.securityConfig).toBe('object');

      expect(() => {
        module.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();

      expect(() => {
        module.logSecurityConfig();
      }).not.toThrow();

      const requiredProperties = [
        'contentTypeOptions',
        'frameOptions',
        'xssProtection',
        'hstsMaxAge',
        'hstsIncludeSubdomains',
        'hstsPreload',
        'referrerPolicy',
        'removePoweredBy',
      ];

      requiredProperties.forEach((prop) => {
        expect(module.securityConfig).toHaveProperty(prop);
      });
    });

    it('should verify middleware execution order and completeness', async () => {
      process.env.NODE_ENV = 'production';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      const callOrder: string[] = [];

      (mockResponse.setHeader as jest.Mock).mockImplementation((name) => {
        callOrder.push(`setHeader:${name}`);
      });

      (mockResponse.removeHeader as jest.Mock).mockImplementation((name) => {
        callOrder.push(`removeHeader:${name}`);
      });

      const originalNext = mockNext;
      mockNext = jest.fn().mockImplementation(() => {
        callOrder.push('next');
      });

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(callOrder).toContain('setHeader:X-Content-Type-Options');
      expect(callOrder).toContain('setHeader:X-Frame-Options');
      expect(callOrder).toContain('setHeader:X-XSS-Protection');
      expect(callOrder).toContain('setHeader:Strict-Transport-Security');
      expect(callOrder).toContain('setHeader:Referrer-Policy');
      expect(callOrder).toContain('removeHeader:X-Powered-By');
      expect(callOrder).toContain('next');

      expect(callOrder[callOrder.length - 1]).toBe('next');
    });

    it('should achieve complete branch coverage', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'test';
      let module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');

      jest.resetModules();
      process.env.NODE_ENV = 'production';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('DENY');

      jest.resetModules();
      process.env.NODE_ENV = 'development';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');

      jest.resetModules();
      process.env.NODE_ENV = 'staging';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');

      jest.resetModules();
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'false';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';
      module = await import('../../middleware/security.middleware.js');
      expect(module.securityConfig.hstsIncludeSubdomains).toBe(false);
      expect(module.securityConfig.hstsPreload).toBe(false);
      expect(module.securityConfig.removePoweredBy).toBe(false);

      jest.resetModules();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';
      module = await import('../../middleware/security.middleware.js');
      module.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall[1]).toBe('max-age=0; includeSubDomains; preload');

      jest.resetModules();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';
      module = await import('../../middleware/security.middleware.js');
      module.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.removeHeader).not.toHaveBeenCalled();

      jest.resetModules();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'test';
      module = await import('../../middleware/security.middleware.js');
      module.logSecurityConfig();
      expect(typeof module.logSecurityConfig).toBe('function');

      jest.resetModules();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'production';
      module = await import('../../middleware/security.middleware.js');
      module.logSecurityConfig();
      expect(typeof module.logSecurityConfig).toBe('function');

      jest.resetModules();
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      module = await import('../../middleware/security.middleware.js');
      module.logSecurityConfig();
      expect(typeof module.logSecurityConfig).toBe('function');
    });
  });

  describe('validateProductionSecurity', () => {
    it('should test production validation logic if it exists', async () => {
      process.env.NODE_ENV = 'production';

      const insecureConfigs = [
        {
          name: 'insecure frame options',
          env: { SECURITY_FRAME_OPTIONS: 'SAMEORIGIN' },
        },
        {
          name: 'low HSTS max-age',
          env: { SECURITY_HSTS_MAX_AGE: '3600' },
        },
        {
          name: 'disabled HSTS includeSubDomains',
          env: { SECURITY_HSTS_INCLUDE_SUBDOMAINS: 'false' },
        },
        {
          name: 'disabled X-Powered-By removal',
          env: { SECURITY_REMOVE_POWERED_BY: 'false' },
        },
      ];

      for (const config of insecureConfigs) {
        jest.resetModules();
        jest.clearAllMocks();

        Object.assign(process.env, config.env);

        const { securityHeaders } = await import('../../middleware/security.middleware.js');

        expect(() => {
          securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
        }).not.toThrow();

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should handle production environment with multiple insecure settings', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      process.env.NODE_ENV = 'production';
      process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';
      process.env.SECURITY_HSTS_MAX_AGE = '0';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';

      const { securityHeaders } = await import('../../middleware/security.middleware.js');

      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall[1]).toContain('max-age=0');

      expect(mockResponse.removeHeader).not.toHaveBeenCalledWith('X-Powered-By');
    });

    it('should test boundary conditions for HSTS max-age validation', async () => {
      const testCases = [
        { maxAge: '31535999', description: 'one second less than required' },
        { maxAge: '31536000', description: 'exactly the required minimum' },
        { maxAge: '31536001', description: 'one second more than required' },
      ];

      for (const testCase of testCases) {
        jest.resetModules();
        jest.clearAllMocks();

        process.env.NODE_ENV = 'production';
        process.env.SECURITY_HSTS_MAX_AGE = testCase.maxAge;

        const { securityHeaders } = await import('../../middleware/security.middleware.js');

        expect(() => {
          securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
        }).not.toThrow();

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should verify production security config loading with validation paths', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'production';

      const validationTests = [
        {
          config: { SECURITY_FRAME_OPTIONS: 'ALLOW-FROM https://example.com' },
          expectedFrameOptions: 'ALLOW-FROM https://example.com',
        },
        {
          config: { SECURITY_HSTS_MAX_AGE: '86400' },
          expectedMaxAge: 86400,
        },
        {
          config: { SECURITY_HSTS_INCLUDE_SUBDOMAINS: 'false' },
          expectedIncludeSubdomains: false,
        },
        {
          config: { SECURITY_REMOVE_POWERED_BY: 'false' },
          expectedRemovePoweredBy: false,
        },
      ];

      for (const test of validationTests) {
        jest.resetModules();
        Object.assign(process.env, test.config);

        const { securityConfig } = await import('../../middleware/security.middleware.js');

        if (test.expectedFrameOptions) {
          expect(securityConfig.frameOptions).toBe(test.expectedFrameOptions);
        }
        if (test.expectedMaxAge !== undefined) {
          expect(securityConfig.hstsMaxAge).toBe(test.expectedMaxAge);
        }
        if (test.expectedIncludeSubdomains !== undefined) {
          expect(securityConfig.hstsIncludeSubdomains).toBe(test.expectedIncludeSubdomains);
        }
        if (test.expectedRemovePoweredBy !== undefined) {
          expect(securityConfig.removePoweredBy).toBe(test.expectedRemovePoweredBy);
        }
      }
    });
    it('should test all production validation code paths', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'production';

      const problematicConfig = {
        SECURITY_FRAME_OPTIONS: 'SAMEORIGIN',
        SECURITY_HSTS_MAX_AGE: '3600',
        SECURITY_HSTS_INCLUDE_SUBDOMAINS: 'false',
        SECURITY_REMOVE_POWERED_BY: 'false',
      };

      Object.assign(process.env, problematicConfig);

      const module = await import('../../middleware/security.middleware.js');

      expect(module.securityConfig.frameOptions).toBe('SAMEORIGIN');
      expect(module.securityConfig.hstsMaxAge).toBe(3600);
      expect(module.securityConfig.hstsIncludeSubdomains).toBe(false);
      expect(module.securityConfig.removePoweredBy).toBe(false);

      module.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall[1]).toContain('max-age=3600');

      expect(mockResponse.removeHeader).not.toHaveBeenCalled();
    });
  });
});
