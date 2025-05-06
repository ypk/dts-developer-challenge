/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
import { Request, Response } from 'express';
import { CaseStatus } from '@prisma/client';
import { caseService } from '../services/caseService.js';
import { sendSuccess, sendError, sendBadRequest, sendNoContent } from '../utils/responseHandler.js';
import { NotFoundError } from '../utils/errorHander.ts';

export const caseController = {
  getAllCases: async (req: Request, res: Response): Promise<void> => {
    try {
      const cases = await caseService.getAllCases();

      sendSuccess(res, {
        message: 'Cases retrieved successfully',
        count: cases.length,
        data: cases,
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve cases', error);
    }
  },

  getCaseById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendBadRequest(res, 'Invalid case ID');
      }

      try {
        const caseData = await caseService.getCaseById(id);

        sendSuccess(res, {
          message: 'Case retrieved successfully',
          data: caseData,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return sendError(res, error.message, error, 404);
        }
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve case', error);
    }
  },

  createCase: async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, status, dueDate } = req.body;

      if (!title) {
        return sendBadRequest(res, 'Title is required');
      }

      const newCase = await caseService.createCase({
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
  },

  updateCase: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendBadRequest(res, 'Invalid case ID');
      }

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
        const updatedCase = await caseService.updateCase(id, updateData);

        sendSuccess(res, {
          message: 'Case updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return sendError(res, error.message, error, 404);
        }
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to update case', error);
    }
  },

  updateCaseStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendBadRequest(res, 'Invalid case ID');
      }

      const { status } = req.body;

      if (!status) {
        return sendBadRequest(res, 'Status is required');
      }

      // Validate status
      if (!Object.values(CaseStatus).includes(status)) {
        return sendBadRequest(
          res,
          `Invalid status. Must be one of: ${Object.values(CaseStatus).join(', ')}`,
        );
      }

      try {
        const updatedCase = await caseService.updateCaseStatus(id, status);

        sendSuccess(res, {
          message: 'Case status updated successfully',
          data: updatedCase,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return sendError(res, error.message, error, 404);
        }
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to update case status', error);
    }
  },

  deleteCase: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return sendBadRequest(res, 'Invalid case ID');
      }

      try {
        await caseService.deleteCase(id);
        sendNoContent(res);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return sendError(res, error.message, error, 404);
        }
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to delete case', error);
    }
  },
};
