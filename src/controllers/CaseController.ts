/**
 * ESM Import Note:
 * Using .js extensions because this project uses ES Modules with NodeNext resolution.
 * TypeScript compiles .ts → .js, so import paths must reference the output files.
 */

/**
 * Case Controller Module
 * @module CaseController
 * @description Provides HTTP request handlers for case-related operations
 */
import { Request, Response } from 'express';
import { CaseStatus } from '../services/PrismaService.js';
import { CaseServiceInstance } from '../services/CaseService.js';
import { sendSuccess, sendError, sendBadRequest, sendNoContent } from '../utils/responseHandler.js';
import { validateAndParseId, handleNotFoundError } from '../utils/caseHelper.js';

/**
 * Controller responsible for handling case-related HTTP requests
 * @class CaseController
 * @description Implements REST endpoints for CRUD operations on cases
 */
export class CaseController {
  /**
   * Retrieves all cases with optional pagination
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error retrieving cases
   */
  public async getAllCases(req: Request, res: Response): Promise<void> {
    try {
      if (req.pagination) {
        const { page, limit } = req.pagination;
        const result = await CaseServiceInstance.getAllCasesPaginated(page, limit);

        sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: result.meta.total,
          data: result.data,
          pagination: result.meta,
        });
      } else {
        const cases = await CaseServiceInstance.getAllCases();

        sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: cases.length,
          data: cases,
        });
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve cases', error);
    }
  }

  /**
   * Retrieves a specific case by ID
   * @async
   * @param {Request} req - Express request object containing case ID in params
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error retrieving the case or if the case is not found
   */
  public async getCaseById(req: Request, res: Response): Promise<void> {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      try {
        const caseData = await CaseServiceInstance.getCaseById(id);

        sendSuccess(res, {
          message: 'Case retrieved successfully',
          data: caseData,
        });
      } catch (error) {
        if (handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve case', error);
    }
  }

  /**
   * Creates a new case
   * @async
   * @param {Request} req - Express request object containing case data in the body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error creating the case
   */
  public async createCase(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, status, dueDate } = req.body;

      if (!title) {
        return sendBadRequest(res, 'Title is required');
      }

      const newCase = await CaseServiceInstance.createCase({
        title,
        description,
        status: status || CaseStatus.PENDING,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      sendSuccess(
        res,
        {
          message: 'Case created successfully',
          data: newCase,
        },
        201,
      );
    } catch (error) {
      sendError(res, 'Failed to create case', error);
    }
  }

  /**
   * Updates an existing case
   * @async
   * @param {Request} req - Express request object containing case ID in params and update data in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error updating the case or if the case is not found
   */
  public async updateCase(req: Request, res: Response): Promise<void> {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      if (!req.body || Object.keys(req.body).length === 0) {
        return sendBadRequest(res, 'Request body is required');
      }

      const { title, description, status, dueDate } = req.body;

      const updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      };

      try {
        const updatedCase = await CaseServiceInstance.updateCase(id, updateData);

        sendSuccess(res, {
          message: 'Case updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to update case', error);
    }
  }

  /**
   * Updates only the status of an existing case
   * @async
   * @param {Request} req - Express request object containing case ID in params and status in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error updating the case status or if the case is not found
   */
  public async updateCaseStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      const { status } = req.body;

      if (!status) {
        return sendBadRequest(res, 'Status is required');
      }

      if (!Object.values(CaseStatus).includes(status)) {
        return sendBadRequest(
          res,
          `Invalid status. Must be one of: ${Object.values(CaseStatus).join(', ')}`,
        );
      }

      try {
        const updatedCase = await CaseServiceInstance.updateCaseStatus(id, status);

        sendSuccess(res, {
          message: 'Case status updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to update case status', error);
    }
  }

  /**
   * Deletes a case by ID
   * @async
   * @param {Request} req - Express request object containing case ID in params
   * @param {Response} res - Express response object
   * @returns {Promise<void>} - Promise representing the completion of the request handling
   * @throws {Error} - If there's an error deleting the case or if the case is not found
   */
  public async deleteCase(req: Request, res: Response): Promise<void> {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      try {
        await CaseServiceInstance.deleteCase(id);
        sendNoContent(res);
      } catch (error) {
        if (handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to delete case', error);
    }
  }
}

/**
 * Singleton instance of the CaseController class
 * @type {CaseController}
 * @description Exported for use in route definitions and other modules
 */
export const CaseControllerInstance = new CaseController();
