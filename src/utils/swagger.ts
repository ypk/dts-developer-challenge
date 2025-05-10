import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { ISwaggerUtils } from '../interfaces/ISwaggerUtils.ts';

/**
 * Implementation of Swagger documentation utilities
 */
export class SwaggerUtils implements ISwaggerUtils {
  /**
   * Get Swagger configuration options
   * @returns Swagger JSDoc options
   */
  public getSwaggerOptions(): swaggerJsdoc.Options {
    return {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Case Management API',
          version: '1.0.0',
          description: 'API documentation for the Case Management System',
          contact: {
            name: 'HMCTS',
          },
        },
        servers: [
          {
            url: '/api',
            description: 'Development server',
          },
        ],
        components: {
          schemas: {
            Case: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  description: 'The case ID',
                  example: 1,
                },
                title: {
                  type: 'string',
                  description: 'The case title',
                  example: 'Important Case',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  description: 'The case description',
                  example: 'This is an important case that needs attention',
                },
                status: {
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                  description: 'The current status of the case',
                  example: 'PENDING',
                },
                dueDate: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'The due date for the case',
                  example: '2023-12-31T23:59:59Z',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the case was created',
                  example: '2023-01-01T12:00:00Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the case was last updated',
                  example: '2023-01-02T14:30:00Z',
                },
              },
              required: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
            },
            CreateCaseRequest: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'The case title',
                  example: 'New Case',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  description: 'The case description',
                  example: 'This is a new case',
                },
                status: {
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                  description: 'The initial status of the case',
                  example: 'PENDING',
                },
                dueDate: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'The due date for the case',
                  example: '2023-12-31T23:59:59Z',
                },
              },
              required: ['title'],
            },
            UpdateCaseRequest: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'The updated case title',
                  example: 'Updated Case Title',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  description: 'The updated case description',
                  example: 'This is an updated description',
                },
                status: {
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                  description: 'The updated status of the case',
                  example: 'IN_PROGRESS',
                },
                dueDate: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'The updated due date for the case',
                  example: '2024-01-31T23:59:59Z',
                },
              },
            },
            UpdateCaseStatusRequest: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                  description: 'The new status of the case',
                  example: 'COMPLETED',
                },
              },
              required: ['status'],
            },
            ErrorResponse: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                error: {
                  type: 'string',
                  example: 'Detailed error information',
                },
              },
            },
          },
          responses: {
            BadRequest: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            NotFound: {
              description: 'Resource not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            InternalServerError: {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      apis: ['./src/routes/*.ts'],
    };
  }

  /**
   * Set up Swagger documentation routes
   * @param app Express application instance
   */
  public setupSwagger(app: Express): void {
    const options = this.getSwaggerOptions();
    const specs = swaggerJsdoc(options);

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
  }
}

const swaggerUtilsInstance = new SwaggerUtils();

// For backward compatibility
export const getSwaggerOptions = (): swaggerJsdoc.Options => {
  return swaggerUtilsInstance.getSwaggerOptions();
};

export const setupSwagger = (app: Express): void => {
  swaggerUtilsInstance.setupSwagger(app);
};
