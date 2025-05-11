import { Container } from 'inversify';
import { TYPES } from './types.ts';

import { ICaseRepository } from '../interfaces/ICaseRepository.ts';
import { ICaseService } from '../interfaces/ICaseService.ts';
import { ICaseController } from '../interfaces/ICaseController.ts';
import { ICaseHelper } from '../interfaces/ICaseHelper.ts';
import { IResponseHandler } from '../interfaces/IResponseHandler.ts';

import { CaseRepository } from '../repositories/CaseRepository.ts';
import { CaseService } from '../services/CaseService.ts';
import { CaseController } from '../controllers/CaseController.ts';
import { CaseHelper } from '../utils/caseHelper.ts';
import { ResponseHandler } from '../utils/responseHandler.ts';

import { LoggerService } from '../services/LoggerService.ts';
import { ILoggerService } from '../interfaces/ILoggerService.ts';

export const container = new Container();

container.bind<IResponseHandler>(TYPES.ResponseHandler).to(ResponseHandler).inSingletonScope();

container.bind<ILoggerService>(TYPES.LoggerService).to(LoggerService).inSingletonScope();

container.bind<ICaseRepository>(TYPES.CaseRepository).to(CaseRepository).inSingletonScope();

container
  .bind<ICaseHelper>(TYPES.CaseHelper)
  .toDynamicValue((context) => {
    const responseHandler = context.get<IResponseHandler>(TYPES.ResponseHandler);
    return new CaseHelper(responseHandler);
  })
  .inSingletonScope();

container
  .bind<ICaseService>(TYPES.CaseService)
  .toDynamicValue((context) => {
    const repository = context.get<ICaseRepository>(TYPES.CaseRepository);
    return new CaseService(repository);
  })
  .inSingletonScope();

container
  .bind<ICaseController>(TYPES.CaseController)
  .toDynamicValue((context) => {
    const service = context.get<ICaseService>(TYPES.CaseService);
    const caseHelper = context.get<ICaseHelper>(TYPES.CaseHelper);
    const responseHandler = context.get<IResponseHandler>(TYPES.ResponseHandler);
    return new CaseController(service, caseHelper, responseHandler);
  })
  .inSingletonScope();
