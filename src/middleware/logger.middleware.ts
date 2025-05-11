import { Request, Response, NextFunction } from 'express';
import { container } from '../di/container.ts';
import { TYPES } from '../di/types.ts';
import { ILoggerService } from '../interfaces/ILoggerService.ts';

/**
 * Middleware to log HTTP requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const logger = container.get<ILoggerService>(TYPES.LoggerService);

  const start = Date.now();
  const { method, url, ip } = req;

  logger.info(`Incoming Request`, {
    method,
    url,
    ip,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    if (statusCode >= 400) {
      logger.warn(`HTTP ${statusCode}`, {
        method,
        url,
        statusCode,
        duration,
      });
    } else {
      logger.info(`HTTP ${statusCode}`, {
        method,
        url,
        statusCode,
        duration,
      });
    }
  });

  next();
};
