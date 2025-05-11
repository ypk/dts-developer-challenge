import { CaseStatus } from '../../lib/prisma.ts';
import { Container } from 'inversify';
import { container } from '../../di/container.ts';
import { TYPES } from '../../di/types.ts';
import { ICaseRepository } from '../../interfaces/ICaseRepository.ts';
import { ICaseService } from '../../interfaces/ICaseService.ts';
import { ICaseController } from '../../interfaces/ICaseController.ts';
import { ICaseHelper } from '../../interfaces/ICaseHelper.ts';
import { IResponseHandler } from '../../interfaces/IResponseHandler.ts';
import { ILoggerService } from '../../interfaces/ILoggerService.ts';
import { CaseRepository } from '../../repositories/CaseRepository.ts';
import { CaseService } from '../../services/CaseService.ts';
import { CaseController } from '../../controllers/CaseController.ts';
import { CaseHelper } from '../../utils/caseHelper.ts';
import { ResponseHandler } from '../../utils/responseHandler.ts';
import { LoggerService } from '../../services/LoggerService.ts';

describe('Dependency Injection Container', () => {
  it('should be an instance of inversify Container', () => {
    expect(container).toBeInstanceOf(Container);
  });

  describe('Bindings', () => {
    it('should resolve ResponseHandler', () => {
      const responseHandler = container.get<IResponseHandler>(TYPES.ResponseHandler);
      expect(responseHandler).toBeInstanceOf(ResponseHandler);
    });

    it('should resolve LoggerService', () => {
      const loggerService = container.get<ILoggerService>(TYPES.LoggerService);
      expect(loggerService).toBeInstanceOf(LoggerService);
    });

    it('should resolve CaseRepository', () => {
      const caseRepository = container.get<ICaseRepository>(TYPES.CaseRepository);
      expect(caseRepository).toBeInstanceOf(CaseRepository);
    });

    it('should resolve CaseHelper with ResponseHandler dependency', () => {
      const caseHelper = container.get<ICaseHelper>(TYPES.CaseHelper);
      expect(caseHelper).toBeInstanceOf(CaseHelper);

      const responseHandler = container.get<IResponseHandler>(TYPES.ResponseHandler);

      const caseHelper2 = container.get<ICaseHelper>(TYPES.CaseHelper);
      expect(caseHelper).toBe(caseHelper2);
    });

    it('should resolve CaseService with CaseRepository dependency', () => {
      const caseService = container.get<ICaseService>(TYPES.CaseService);
      expect(caseService).toBeInstanceOf(CaseService);

      const caseService2 = container.get<ICaseService>(TYPES.CaseService);
      expect(caseService).toBe(caseService2);
    });

    it('should resolve CaseController with dependencies', () => {
      const caseController = container.get<ICaseController>(TYPES.CaseController);
      expect(caseController).toBeInstanceOf(CaseController);

      const caseController2 = container.get<ICaseController>(TYPES.CaseController);
      expect(caseController).toBe(caseController2);
    });
  });

  describe('Dependency Resolution', () => {
    let testContainer: Container;
    let mockResponseHandler: jest.Mocked<IResponseHandler>;
    let mockRepository: jest.Mocked<ICaseRepository>;

    beforeEach(() => {
      testContainer = new Container();

      mockResponseHandler = {
        sendSuccess: jest.fn(),
        sendError: jest.fn(),
        sendBadRequest: jest.fn(),
        sendNoContent: jest.fn(),
      } as jest.Mocked<IResponseHandler>;

      mockRepository = {
        findAll: jest.fn(),
        findAllPaginated: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateStatus: jest.fn(),
        delete: jest.fn(),
      } as jest.Mocked<ICaseRepository>;

      testContainer
        .bind<IResponseHandler>(TYPES.ResponseHandler)
        .toConstantValue(mockResponseHandler);
      testContainer.bind<ICaseRepository>(TYPES.CaseRepository).toConstantValue(mockRepository);
    });

    it('should properly inject CaseHelper with ResponseHandler', () => {
      testContainer
        .bind<ICaseHelper>(TYPES.CaseHelper)
        .toDynamicValue((context) => {
          const responseHandler = context.get<IResponseHandler>(TYPES.ResponseHandler);
          return new CaseHelper(responseHandler);
        })
        .inSingletonScope();

      const caseHelper = testContainer.get<ICaseHelper>(TYPES.CaseHelper);
      expect(caseHelper).toBeInstanceOf(CaseHelper);

      const req: any = { params: { id: 'not-a-number' } };
      const res: any = {};

      caseHelper.validateAndParseId(req, res);
      expect(mockResponseHandler.sendBadRequest).toHaveBeenCalled();
    });

    it('should properly inject CaseService with CaseRepository', async () => {
      const mockCases = [
        {
          id: 1,
          title: 'Test Case',
          description: null,
          status: 'PENDING' as CaseStatus,
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockRepository.findAll.mockResolvedValue(mockCases);

      testContainer
        .bind<ICaseService>(TYPES.CaseService)
        .toDynamicValue((context) => {
          const repository = context.get<ICaseRepository>(TYPES.CaseRepository);
          return new CaseService(repository);
        })
        .inSingletonScope();

      const caseService = testContainer.get<ICaseService>(TYPES.CaseService);
      expect(caseService).toBeInstanceOf(CaseService);

      await caseService.getAllCases();
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });
});
