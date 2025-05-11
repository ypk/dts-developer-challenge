import { Request, Response } from 'express';
import { CaseStatus } from '../lib/prisma.ts';
import { ICaseService } from '../interfaces/ICaseService.ts';
import { ICaseController } from '../interfaces/ICaseController.ts';
import { ICaseHelper } from '../interfaces/ICaseHelper.ts';
import { IResponseHandler } from '../interfaces/IResponseHandler.ts';
import { CaseServiceInstance } from '../services/CaseService.ts';
import { CaseHelper } from '../utils/caseHelper.ts';
import { ResponseHandler } from '../utils/responseHandler.ts';

/**
 * Implementation of the case controller interface
 */
export class CaseController implements ICaseController {
  private service: ICaseService;
  private caseHelper: ICaseHelper;
  private responseHandler: IResponseHandler;

  /**
   * Constructor
   * @param service Case service implementation
   * @param caseHelper Case helper implementation
   * @param responseHandler Response handler implementation
   */
  constructor(service: ICaseService, caseHelper: ICaseHelper, responseHandler: IResponseHandler) {
    this.service = service;
    this.caseHelper = caseHelper;
    this.responseHandler = responseHandler;
  }

  /**
   * Get all cases with optional pagination
   * @param req Express request object
   * @param res Express response object
   */
  async getAllCases(req: Request, res: Response): Promise<void> {
    try {
      if (req.pagination) {
        const { page, limit } = req.pagination;
        const result = await this.service.getAllCasesPaginated(page, limit);

        this.responseHandler.sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: result.meta.total,
          data: result.data,
          pagination: result.meta,
        });
      } else {
        const cases = await this.service.getAllCases();

        this.responseHandler.sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: cases.length,
          data: cases,
        });
      }
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to retrieve cases', error);
    }
  }

  /**
   * Get a case by its ID
   * @param req Express request object with case ID parameter
   * @param res Express response object
   */
  async getCaseById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.caseHelper.validateAndParseId(req, res);
      if (id === null) return;

      try {
        const caseData = await this.service.getCaseById(id);

        this.responseHandler.sendSuccess(res, {
          message: 'Case retrieved successfully',
          data: caseData,
        });
      } catch (error) {
        if (this.caseHelper.handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to retrieve case', error);
    }
  }

  /**
   * Create a new case
   * @param req Express request object with case data in body
   * @param res Express response object
   */
  async createCase(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, status, dueDate } = req.body;

      if (!title) {
        return this.responseHandler.sendBadRequest(res, 'Title is required');
      }

      const newCase = await this.service.createCase({
        title,
        description,
        status: status || CaseStatus.PENDING,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      this.responseHandler.sendSuccess(
        res,
        {
          message: 'Case created successfully',
          data: newCase,
        },
        201,
      );
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to create case', error);
    }
  }

  /**
   * Update an existing case
   * @param req Express request object with case ID parameter and updated data in body
   * @param res Express response object
   */
  async updateCase(req: Request, res: Response): Promise<void> {
    try {
      const id = this.caseHelper.validateAndParseId(req, res);
      if (id === null) return;

      if (!req.body || Object.keys(req.body).length === 0) {
        return this.responseHandler.sendBadRequest(res, 'Request body is required');
      }

      const { title, description, status, dueDate } = req.body;

      const updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      };

      try {
        const updatedCase = await this.service.updateCase(id, updateData);

        this.responseHandler.sendSuccess(res, {
          message: 'Case updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (this.caseHelper.handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to update case', error);
    }
  }

  /**
   * Update only the status of a case
   * @param req Express request object with case ID parameter and status in body
   * @param res Express response object
   */
  async updateCaseStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = this.caseHelper.validateAndParseId(req, res);
      if (id === null) return;

      const { status } = req.body;

      if (!status) {
        return this.responseHandler.sendBadRequest(res, 'Status is required');
      }

      if (!Object.values(CaseStatus).includes(status)) {
        return this.responseHandler.sendBadRequest(
          res,
          `Invalid status. Must be one of: ${Object.values(CaseStatus).join(', ')}`,
        );
      }

      try {
        const updatedCase = await this.service.updateCaseStatus(id, status);

        this.responseHandler.sendSuccess(res, {
          message: 'Case status updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (this.caseHelper.handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to update case status', error);
    }
  }

  /**
   * Delete a case
   * @param req Express request object with case ID parameter
   * @param res Express response object
   */
  async deleteCase(req: Request, res: Response): Promise<void> {
    try {
      const id = this.caseHelper.validateAndParseId(req, res);
      if (id === null) return;

      try {
        await this.service.deleteCase(id);
        this.responseHandler.sendNoContent(res);
      } catch (error) {
        if (this.caseHelper.handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      this.responseHandler.sendError(res, 'Failed to delete case', error);
    }
  }
}

// Create a singleton instance using the service implementation
const responseHandler = new ResponseHandler();
const caseHelper = new CaseHelper(responseHandler);
export const CaseControllerInstance = new CaseController(
  CaseServiceInstance,
  caseHelper,
  responseHandler,
);
