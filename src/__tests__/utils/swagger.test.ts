/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
import { Express } from 'express';

const mockSwaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Test API' },
};

const mockSwaggerJsdoc = jest.fn().mockReturnValue(mockSwaggerSpec);
jest.mock('swagger-jsdoc', () => mockSwaggerJsdoc);

const mockSwaggerUi = {
  serve: ['swagger-serve-middleware'],
  setup: jest.fn().mockReturnValue('swagger-ui-middleware'),
};
jest.mock('swagger-ui-express', () => mockSwaggerUi);

jest.isolateModules(() => {
  let setupSwagger: (app: Express) => void;

  beforeAll(async () => {
    const swaggerModule = await import('../../utils/swagger.ts');
    setupSwagger = swaggerModule.setupSwagger;
  });

  describe('Swagger Configuration', () => {
    let mockApp: Partial<Express>;

    beforeEach(() => {
      jest.clearAllMocks();

      mockApp = {
        use: jest.fn(),
        get: jest.fn(),
      };
    });

    it('should set up swagger UI endpoint', () => {
      setupSwagger(mockApp as Express);

      expect(mockApp.use).toHaveBeenCalledWith(
        '/api-docs',
        mockSwaggerUi.serve,
        'swagger-ui-middleware',
      );

      expect(mockSwaggerUi.setup).toHaveBeenCalledWith(mockSwaggerSpec);
    });

    it('should set up swagger JSON endpoint', () => {
      setupSwagger(mockApp as Express);

      expect(mockApp.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));

      const handlerFn = (mockApp.get as jest.Mock).mock.calls[0][1];

      const mockReq = {};
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      handlerFn(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.send).toHaveBeenCalledWith(mockSwaggerSpec);
    });

    it('should use swagger-jsdoc with correct configuration', () => {
      setupSwagger(mockApp as Express);

      expect(mockSwaggerJsdoc).toHaveBeenCalled();

      const options = mockSwaggerJsdoc.mock.calls[0][0];

      expect(options).toHaveProperty('definition');
      expect(options).toHaveProperty('apis');
      expect(options.apis).toEqual(['./src/routes/*.ts']);

      const { definition } = options;
      expect(definition.openapi).toBe('3.0.0');
      expect(definition.info.title).toBe('Case Management API');
      expect(definition.info.version).toBe('1.0.0');
      expect(definition.servers[0].url).toBe('/api');

      expect(definition.components).toHaveProperty('schemas');
      expect(definition.components).toHaveProperty('responses');

      const { schemas } = definition.components;
      expect(schemas).toHaveProperty('Case');
      expect(schemas).toHaveProperty('CreateCaseRequest');
      expect(schemas).toHaveProperty('UpdateCaseRequest');
      expect(schemas).toHaveProperty('UpdateCaseStatusRequest');
      expect(schemas).toHaveProperty('ErrorResponse');

      expect(schemas.Case.type).toBe('object');
      expect(schemas.Case.properties).toHaveProperty('id');
      expect(schemas.Case.properties).toHaveProperty('title');
      expect(schemas.Case.properties).toHaveProperty('status');
      expect(schemas.Case.required).toContain('id');
      expect(schemas.Case.required).toContain('title');
      expect(schemas.Case.required).toContain('status');

      expect(schemas.CreateCaseRequest.type).toBe('object');
      expect(schemas.CreateCaseRequest.properties).toHaveProperty('title');
      expect(schemas.CreateCaseRequest.required).toContain('title');

      const { responses } = definition.components;
      expect(responses).toHaveProperty('BadRequest');
      expect(responses).toHaveProperty('NotFound');
      expect(responses).toHaveProperty('InternalServerError');
    });
  });
});
