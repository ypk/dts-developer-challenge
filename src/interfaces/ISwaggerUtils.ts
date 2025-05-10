import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

/**
 * Interface for Swagger documentation utilities
 */
export interface ISwaggerUtils {
  /**
   * Get Swagger configuration options
   * @returns Swagger JSDoc options
   */
  getSwaggerOptions(): swaggerJsdoc.Options;

  /**
   * Set up Swagger documentation routes
   * @param app Express application instance
   */
  setupSwagger(app: Express): void;
}
