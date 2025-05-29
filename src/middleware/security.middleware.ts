/**
 * ESM Import Note:
 * Using .js extensions because this project uses ES Modules with NodeNext resolution.
 * TypeScript compiles .ts → .js, so import paths must reference the output files.
 */

/**
 * Security Headers Middleware Module
 * @module securityMiddleware
 * @description Provides HTTP security headers to protect against common web vulnerabilities
 * using configuration from environment variables
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.middleware.js';

/**
 * Interface for security header configuration
 * @interface SecurityConfig
 */
interface SecurityConfig {
  contentTypeOptions: string;
  frameOptions: string;
  xssProtection: string;
  hstsMaxAge: number;
  hstsIncludeSubdomains: boolean;
  hstsPreload: boolean;
  referrerPolicy: string;
  removePoweredBy: boolean;
}

/**
 * Loads security configuration from environment variables
 * @function loadSecurityConfig
 * @returns {SecurityConfig} The security configuration
 */
const loadSecurityConfig = (): SecurityConfig => {
  if (process.env.NODE_ENV === 'test') {
    return {
      contentTypeOptions: 'nosniff',
      frameOptions: 'SAMEORIGIN',
      xssProtection: '1; mode=block',
      hstsMaxAge: 0,
      hstsIncludeSubdomains: false,
      hstsPreload: false,
      referrerPolicy: 'no-referrer-when-downgrade',
      removePoweredBy: true,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    const hstsMaxAge = parseInt(process.env.SECURITY_HSTS_MAX_AGE || '31536000', 10);

    return {
      contentTypeOptions: process.env.SECURITY_CONTENT_TYPE_OPTIONS || 'nosniff',
      frameOptions: process.env.SECURITY_FRAME_OPTIONS || 'DENY',
      xssProtection: process.env.SECURITY_XSS_PROTECTION || '1; mode=block',
      hstsMaxAge: isNaN(hstsMaxAge) ? 31536000 : hstsMaxAge,
      hstsIncludeSubdomains: process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS !== 'false',
      hstsPreload: process.env.SECURITY_HSTS_PRELOAD !== 'false',
      referrerPolicy: process.env.SECURITY_REFERRER_POLICY || 'no-referrer-when-downgrade',
      removePoweredBy: process.env.SECURITY_REMOVE_POWERED_BY !== 'false',
    };
  }

  const hstsMaxAge = parseInt(process.env.SECURITY_HSTS_MAX_AGE || '0', 10);

  return {
    contentTypeOptions: process.env.SECURITY_CONTENT_TYPE_OPTIONS || 'nosniff',
    frameOptions: process.env.SECURITY_FRAME_OPTIONS || 'SAMEORIGIN',
    xssProtection: process.env.SECURITY_XSS_PROTECTION || '1; mode=block',
    hstsMaxAge: isNaN(hstsMaxAge) ? 0 : hstsMaxAge,
    hstsIncludeSubdomains: process.env.SECURITY_HSTS_INCLUDE_SUBDOMAINS === 'true',
    hstsPreload: process.env.SECURITY_HSTS_PRELOAD === 'true',
    referrerPolicy: process.env.SECURITY_REFERRER_POLICY || 'no-referrer-when-downgrade',
    removePoweredBy: process.env.SECURITY_REMOVE_POWERED_BY !== 'false',
  };
};

/**
 * Builds the HSTS header value based on configuration
 * @function buildHstsHeader
 * @param {SecurityConfig} config - The security configuration
 * @returns {string} The HSTS header value
 */
const buildHstsHeader = (config: SecurityConfig): string => {
  let header = `max-age=${config.hstsMaxAge}`;

  if (config.hstsIncludeSubdomains) {
    header += '; includeSubDomains';
  }

  if (config.hstsPreload) {
    header += '; preload';
  }

  return header;
};

/**
 * Validates that security configuration is appropriate for production
 * @function validateProductionSecurity
 * @param {SecurityConfig} config - The security configuration
 * @returns {void}
 */
const validateProductionSecurity = (config: SecurityConfig): void => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const issues: string[] = [];

  if (config.frameOptions !== 'DENY') {
    issues.push(`X-Frame-Options should be DENY in production (current: ${config.frameOptions})`);
  }

  if (config.hstsMaxAge < 31536000) {
    // Less than 1 year
    issues.push(
      `HSTS max-age should be at least 31536000 in production (current: ${config.hstsMaxAge})`,
    );
  }

  if (!config.hstsIncludeSubdomains) {
    issues.push('HSTS includeSubDomains should be enabled in production');
  }

  if (!config.removePoweredBy) {
    issues.push('X-Powered-By header should be removed in production');
  }

  if (issues.length > 0) {
    logger.warn('Production security configuration issues detected', { issues });
  }
};

/**
 * Express middleware for adding security headers to responses
 * @function securityHeaders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description
 * Adds the following security headers to HTTP responses based on environment configuration:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Controls whether the page can be displayed in frames/iframes
 * - X-XSS-Protection: Enables browser's built-in XSS filtering
 * - Strict-Transport-Security: Enforces HTTPS connections
 * - Referrer-Policy: Controls how much referrer information is included with requests
 *
 * Also optionally removes the X-Powered-By header to avoid information disclosure.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const config = loadSecurityConfig();

    validateProductionSecurity(config);

    res.setHeader('X-Content-Type-Options', config.contentTypeOptions);

    res.setHeader('X-Frame-Options', config.frameOptions);

    res.setHeader('X-XSS-Protection', config.xssProtection);

    res.setHeader('Strict-Transport-Security', buildHstsHeader(config));

    res.setHeader('Referrer-Policy', config.referrerPolicy);

    if (config.removePoweredBy) {
      res.removeHeader('X-Powered-By');
    }

    next();
  } catch (error) {
    logger.error('Error applying security headers', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
};

/**
 * Export the security configuration for use in other modules
 * @exports securityConfig
 */
export const securityConfig = loadSecurityConfig();

/**
 * Logs the current security configuration
 * @function logSecurityConfig
 * @returns {void}
 */
export const logSecurityConfig = (): void => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const config = loadSecurityConfig();

  if (process.env.NODE_ENV === 'production') {
    logger.info('Security headers enabled', {
      environment: 'production',
      securityHeadersEnabled: true,
      hstsEnabled: config.hstsMaxAge > 0,
    });
    return;
  }

  logger.info('Security headers configuration loaded', {
    contentTypeOptions: config.contentTypeOptions,
    frameOptions: config.frameOptions,
    hstsMaxAge: config.hstsMaxAge,
    hstsIncludeSubdomains: config.hstsIncludeSubdomains,
    hstsPreload: config.hstsPreload,
    referrerPolicy: config.referrerPolicy,
    removePoweredBy: config.removePoweredBy,
  });
};
