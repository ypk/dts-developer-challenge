import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.middleware.ts';

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: 'Error caught by error handler',
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  if (err instanceof NotFoundError) {
    statusCode = 404;
  } else if (err instanceof ValidationError) {
    statusCode = 400;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export { NotFoundError, ValidationError, DatabaseError, errorHandler };
