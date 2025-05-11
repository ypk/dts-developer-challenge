/**
 * Interface for logger service
 */
export interface ILoggerService {
  /**
   * Log an informational message
   * @param message Message to log
   * @param meta Optional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log a warning message
   * @param message Message to log
   * @param meta Optional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log an error message
   * @param message Message to log
   * @param error Error object or message
   * @param meta Optional metadata
   */
  error(message: string, error: unknown, meta?: Record<string, unknown>): void;

  /**
   * Log a debug message
   * @param message Message to log
   * @param meta Optional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Create a child logger with additional context
   * @param context Additional context for the logger
   * @returns A new logger instance with the added context
   */
  child(context: Record<string, unknown>): ILoggerService;
}
