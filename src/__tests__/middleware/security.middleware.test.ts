import {
  securityHeaders,
  logSecurityConfig,
  securityConfig,
} from '../../middleware/security.middleware.ts';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../middleware/logger.middleware', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockLogger = jest.requireMock('../../middleware/logger.middleware').logger;

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const originalEnv = process.env.NODE_ENV;
  const originalVars: Record<string, string | undefined> = {};

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };
    nextFunction = jest.fn();

    const envVarsToSave = [
      'SECURITY_CONTENT_TYPE_OPTIONS',
      'SECURITY_FRAME_OPTIONS',
      'SECURITY_XSS_PROTECTION',
      'SECURITY_HSTS_MAX_AGE',
      'SECURITY_HSTS_INCLUDE_SUBDOMAINS',
      'SECURITY_HSTS_PRELOAD',
      'SECURITY_REFERRER_POLICY',
      'SECURITY_REMOVE_POWERED_BY',
    ];

    envVarsToSave.forEach((key) => {
      originalVars[key] = process.env[key];
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;

    Object.keys(originalVars).forEach((key) => {
      if (originalVars[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalVars[key];
      }
    });
  });

  describe('securityHeaders middleware', () => {
    it('should set all required security headers in test environment', () => {
      process.env.NODE_ENV = 'test';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer-when-downgrade',
      );
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should set all required security headers in development environment with default values', () => {
      process.env.NODE_ENV = 'development';

      delete process.env.SECURITY_CONTENT_TYPE_OPTIONS;
      delete process.env.SECURITY_FRAME_OPTIONS;
      delete process.env.SECURITY_XSS_PROTECTION;
      delete process.env.SECURITY_HSTS_MAX_AGE;
      delete process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS;
      delete process.env.SECURITY_HSTS_PRELOAD;
      delete process.env.SECURITY_REFERRER_POLICY;
      delete process.env.SECURITY_REMOVE_POWERED_BY;

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=0');
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should set all required security headers in development environment with custom values', () => {
      process.env.NODE_ENV = 'development';

      process.env.SECURITY_CONTENT_TYPE_OPTIONS = 'custom-nosniff';
      process.env.SECURITY_FRAME_OPTIONS = 'DENY';
      process.env.SECURITY_XSS_PROTECTION = '0';
      process.env.SECURITY_HSTS_MAX_AGE = '60';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';
      process.env.SECURITY_REFERRER_POLICY = 'no-referrer';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'custom-nosniff',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '0');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=60; includeSubDomains; preload',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');

      expect(mockResponse.removeHeader).not.toHaveBeenCalled();
    });

    it('should set all required security headers in production environment with default values', () => {
      process.env.NODE_ENV = 'production';

      delete process.env.SECURITY_CONTENT_TYPE_OPTIONS;
      delete process.env.SECURITY_FRAME_OPTIONS;
      delete process.env.SECURITY_XSS_PROTECTION;
      delete process.env.SECURITY_HSTS_MAX_AGE;
      delete process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS;
      delete process.env.SECURITY_HSTS_PRELOAD;
      delete process.env.SECURITY_REFERRER_POLICY;
      delete process.env.SECURITY_REMOVE_POWERED_BY;

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toContain('max-age=31536000');
      expect(hstsCall?.[1]).toContain('includeSubDomains');
      expect(hstsCall?.[1]).toContain('preload');

      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should handle invalid HSTS max-age value in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = 'not-a-number';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toBe('max-age=0');
    });

    it('should handle invalid HSTS max-age value in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SECURITY_HSTS_MAX_AGE = 'not-a-number';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toContain('max-age=31536000');
    });

    it('should handle errors and continue processing', () => {
      mockResponse.setHeader = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle unknown errors and log them properly', () => {
      mockResponse.setHeader = jest.fn().mockImplementation(() => {
        throw 'Not an Error object';
      });

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('validateProductionSecurity', () => {
    it('should log warnings for insecure production settings', () => {
      process.env.NODE_ENV = 'production';

      process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';
      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should not log warnings for secure production settings', () => {
      process.env.NODE_ENV = 'production';

      process.env.SECURITY_FRAME_OPTIONS = 'DENY';
      process.env.SECURITY_HSTS_MAX_AGE = '31536000';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_REMOVE_POWERED_BY = 'true';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should not validate non-production environments', () => {
      process.env.NODE_ENV = 'development';

      process.env.SECURITY_FRAME_OPTIONS = 'SAMEORIGIN';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_REMOVE_POWERED_BY = 'false';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('logSecurityConfig', () => {
    it('should not log in test environment', () => {
      process.env.NODE_ENV = 'test';

      logSecurityConfig();

      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should log minimal info in production environment', () => {
      process.env.NODE_ENV = 'production';

      logSecurityConfig();

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log detailed info in development environment', () => {
      process.env.NODE_ENV = 'development';

      logSecurityConfig();

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('buildHstsHeader', () => {
    it('should build basic HSTS header with only max-age', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'false';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toBe('max-age=3600');
    });

    it('should build HSTS header with includeSubDomains', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'false';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toBe('max-age=3600; includeSubDomains');
    });

    it('should build HSTS header with preload', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'false';
      process.env.SECURITY_HSTS_PRELOAD = 'true';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toBe('max-age=3600; preload');
    });

    it('should build complete HSTS header with all options', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECURITY_HSTS_MAX_AGE = '3600';
      process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS = 'true';
      process.env.SECURITY_HSTS_PRELOAD = 'true';

      securityHeaders(mockRequest as Request, mockResponse as Response, nextFunction);

      const hstsCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === 'Strict-Transport-Security',
      );
      expect(hstsCall).toBeDefined();
      expect(hstsCall?.[1]).toBe('max-age=3600; includeSubDomains; preload');
    });
  });

  describe('securityConfig export', () => {
    it('should export the security configuration', () => {
      expect(securityConfig).toBeDefined();
      expect(securityConfig.contentTypeOptions).toBeDefined();
      expect(securityConfig.frameOptions).toBeDefined();
      expect(securityConfig.xssProtection).toBeDefined();
      expect(securityConfig.hstsMaxAge).toBeDefined();
      expect(securityConfig.hstsIncludeSubdomains).toBeDefined();
      expect(securityConfig.hstsPreload).toBeDefined();
      expect(securityConfig.referrerPolicy).toBeDefined();
      expect(securityConfig.removePoweredBy).toBeDefined();
    });

    it('should have different configurations based on environment', () => {
      const originalEnv = process.env.NODE_ENV;

      try {
        process.env.NODE_ENV = 'production';
        jest.resetModules();
        const { securityConfig: prodConfig } = require('../../middleware/security.middleware');
        process.env.NODE_ENV = 'development';
        jest.resetModules();
        const { securityConfig: devConfig } = require('../../middleware/security.middleware');
        expect(prodConfig.frameOptions).toBe('DENY');
        expect(prodConfig.hstsMaxAge).toBeGreaterThan(0);
        expect(prodConfig.hstsIncludeSubdomains).toBe(true);
        expect(devConfig.frameOptions).toBe('SAMEORIGIN');
        expect(devConfig.hstsMaxAge).toBe(0);
        expect(devConfig.hstsIncludeSubdomains).toBe(false);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
