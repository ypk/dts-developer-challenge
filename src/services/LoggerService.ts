import winston from 'winston';
import { ILoggerService } from '../interfaces/ILoggerService.ts';

/**
 * Implementation of logger service using Winston
 */
export class LoggerService implements ILoggerService {
  private logger: winston.Logger;

  /**
   * Constructor
   * @param options Winston logger options
   */
  constructor(options?: winston.LoggerOptions) {
    this.logger = winston.createLogger(
      options || {
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        defaultMeta: { service: 'case-management-api' },
        transports: [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      },
    );

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      );
    }
  }

  /**
   * Log an informational message
   * @param message Message to log
   * @param meta Optional metadata
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param meta Optional metadata
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object or message
   * @param meta Optional metadata
   */
  public error(message: string, error: unknown, meta?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error(message, {
      error: errorMessage,
      stack,
      ...meta,
    });
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param meta Optional metadata
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Create a child logger with additional context
   * @param context Additional context for the logger
   * @returns A new logger instance with the added context
   */
  public child(context: Record<string, unknown>): ILoggerService {
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}

// Create a singleton instance
export const loggerService = new LoggerService();
