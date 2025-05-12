/**
 * Security Headers Middleware Module
 * @module securityMiddleware
 * @description Provides HTTP security headers to protect against common web vulnerabilities
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Value for X-Content-Type-Options header to prevent MIME type sniffing
 * @constant {string}
 * @default 'nosniff'
 */
const NO_SNIFF = 'nosniff';

/**
 * Value for X-Frame-Options header to prevent clickjacking
 * @constant {string}
 * @default 'SAMEORIGIN'
 */
const SAME_ORIGIN = 'SAMEORIGIN';

/**
 * Express middleware for adding security headers to responses
 * @function securityHeaders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description
 * Adds the following security headers to HTTP responses:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Controls whether the page can be displayed in frames/iframes
 * - X-XSS-Protection: Enables browser's built-in XSS filtering
 * - Strict-Transport-Security: Enforces HTTPS connections
 * - Referrer-Policy: Controls how much referrer information is included with requests
 *
 * Also removes the X-Powered-By header to avoid information disclosure.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevents MIME type sniffing security risks
  res.setHeader('X-Content-Type-Options', NO_SNIFF);

  // Prevents clickjacking by restricting framing to same origin
  res.setHeader('X-Frame-Options', SAME_ORIGIN);

  // Enables browser's built-in XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforces HTTPS connections for one year including subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Controls how much referrer information is included with requests
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  // Removes server information to avoid information disclosure
  res.removeHeader('X-Powered-By');

  next();
};
