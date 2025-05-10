import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
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

export { logger };
