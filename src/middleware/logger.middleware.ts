/**
 * Logging Middleware Module
 * @module loggerMiddleware
 * @description Provides centralized logging capabilities and request logging middleware
 */
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

/**
 * Directory path where log files will be stored
 * @constant {string}
 */
const logsDir = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Configured Winston logger instance
 * @type {winston.Logger}
 * @description
 * Configured with the following settings:
 * - Default log level: 'info'
 * - JSON format with timestamps
 * - Console transport with colorized output
 * - File transports for error.log and combined.log (except in test environment)
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'case-management-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    ...(process.env.NODE_ENV !== 'test'
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
          }),
          new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
        ]
      : []),
  ],
});

/**
 * Express middleware for logging HTTP requests
 * @function requestLogger
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description
 * Logs each incoming request and its completion with the following:
 * - Log entry when a request is received
 * - Log entry when a response is sent
 * - Request details (method, URL, IP, user agent)
 * - Response details (status code, duration)
 * - Uses appropriate log level based on response status code
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  logger.info({
    message: `Request received`,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';

    logger[level]({
      message: `Request completed`,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

/**
 * Export the configured Winston logger instance
 * @exports logger
 */
export { logger };
