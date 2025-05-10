/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from 'express';
import { CaseStatus } from '../lib/prisma.ts';
import { caseService } from '../services/caseService.ts';
import { sendSuccess, sendError, sendBadRequest, sendNoContent } from '../utils/responseHandler.ts';
import { validateAndParseId, handleNotFoundError } from '../utils/caseHelper.ts';

export const caseController = {
  getAllCases: async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.pagination) {
        const { page, limit } = req.pagination;
        const result = await caseService.getAllCasesPaginated(page, limit);

        sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: result.meta.total,
          data: result.data,
          pagination: result.meta,
        });
      } else {
        const cases = await caseService.getAllCases();

        sendSuccess(res, {
          message: 'Cases retrieved successfully',
          count: cases.length,
          data: cases,
        });
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve cases', error);
    }
  },

  getCaseById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      try {
        const caseData = await caseService.getCaseById(id);

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
        const updatedCase = await caseService.updateCase(id, updateData);

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
  },

  updateCaseStatus: async (req: Request, res: Response): Promise<void> => {
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
        const updatedCase = await caseService.updateCaseStatus(id, status);

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
  },

  deleteCase: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = validateAndParseId(req, res);
      if (id === null) return;

      try {
        await caseService.deleteCase(id);
        sendNoContent(res);
      } catch (error) {
        if (handleNotFoundError(error, res)) return;
        throw error;
      }
    } catch (error) {
      sendError(res, 'Failed to delete case', error);
    }
  },
};
