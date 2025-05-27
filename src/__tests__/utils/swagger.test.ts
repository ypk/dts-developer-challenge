jest.mock('express', () => ({
  static: jest.fn(),
}));

jest.mock('swagger-jsdoc');
jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(),
  setup: jest.fn(),
}));

import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { getSwaggerOptions, setupSwagger } from '../../utils/swagger.ts';

const mockSwaggerJsdoc = swaggerJsdoc as jest.MockedFunction<typeof swaggerJsdoc>;
const mockSwaggerUi = swaggerUi as jest.Mocked<typeof swaggerUi>;

describe('swagger utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSwaggerOptions', () => {
    it('should return correct swagger configuration object', () => {
      const options = getSwaggerOptions();

      expect(options).toEqual({
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
      });
    });

    it('should return a new object instance each time', () => {
      const options1 = getSwaggerOptions();
      const options2 = getSwaggerOptions();

      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2);
    });

    it('should have correct schema structure', () => {
      const options = getSwaggerOptions();
      const schemas = options.definition?.components.schemas;

      expect(schemas).toHaveProperty('Case');
      expect(schemas).toHaveProperty('CreateCaseRequest');
      expect(schemas).toHaveProperty('UpdateCaseRequest');
      expect(schemas).toHaveProperty('UpdateCaseStatusRequest');
      expect(schemas).toHaveProperty('ErrorResponse');
    });
  });

  describe('setupSwagger', () => {
    let mockApp: Partial<Express>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockApp = {
        use: jest.fn(),
        get: jest.fn(),
      };

      mockRequest = {};
      mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      (mockSwaggerUi.serve as unknown) = jest.fn();
      (mockSwaggerUi.setup as unknown) = jest.fn().mockReturnValue(jest.fn());
    });

    it('should set up swagger UI middleware and JSON endpoint', () => {
      const mockSpecs = { openapi: '3.0.0', info: { title: 'Test API' } };
      mockSwaggerJsdoc.mockReturnValue(mockSpecs);

      setupSwagger(mockApp as Express);

      expect(mockSwaggerJsdoc).toHaveBeenCalledWith(getSwaggerOptions());
      expect(mockApp.use).toHaveBeenCalledWith(
        '/api-docs',
        mockSwaggerUi.serve,
        expect.any(Function),
      );
      expect(mockApp.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));
    });

    it('should handle GET /api-docs.json route correctly', () => {
      const mockSpecs = { openapi: '3.0.0', info: { title: 'Test API' } };
      mockSwaggerJsdoc.mockReturnValue(mockSpecs);

      setupSwagger(mockApp as Express);

      const routeHandler = (mockApp.get as jest.Mock).mock.calls[0][1];
      routeHandler(mockRequest, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.send).toHaveBeenCalledWith(mockSpecs);
    });
  });
});
