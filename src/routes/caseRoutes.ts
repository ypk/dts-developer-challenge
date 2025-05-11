import express from 'express';
import { container } from '../di/container.ts';
import { TYPES } from '../di/types.ts';
import { ICaseController } from '../interfaces/ICaseController.ts';
import {
  validateCreateCase,
  validateUpdateCase,
  validateUpdateStatus,
  validateDeleteCase,
} from '../middleware/validation.middleware.ts';
import { paginationMiddleware } from '../middleware/pagination.middleware.ts';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

const router = express.Router();
const CaseController = container.get<ICaseController>(TYPES.CaseController);

/**
 * @swagger
 * /cases:
 *   get:
 *     summary: Get all cases
 *     description: Retrieve a list of all cases with optional pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of cases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cases retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', paginationMiddleware, (req, res) => CaseController.getAllCases(req, res));

/**
 * @swagger
 * /cases/{id}:
 *   get:
 *     summary: Get a case by ID
 *     description: Retrieve a specific case by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The case ID
 *     responses:
 *       200:
 *         description: Case details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Case retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id',
  validateDeleteCase,
  (
    req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: express.Response<any, Record<string, any>>,
  ) => CaseController.getCaseById(req, res),
);

/**
 * @swagger
 * /cases:
 *   post:
 *     summary: Create a new case
 *     description: Create a new case with the provided data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCaseRequest'
 *     responses:
 *       201:
 *         description: Case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Case created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  validateCreateCase,
  (
    req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: express.Response<any, Record<string, any>>,
  ) => CaseController.createCase(req, res),
);

/**
 * @swagger
 * /cases/{id}:
 *   put:
 *     summary: Update a case
 *     description: Update an existing case with the provided data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCaseRequest'
 *     responses:
 *       200:
 *         description: Case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Case updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:id',
  validateUpdateCase,
  (
    req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: express.Response<any, Record<string, any>>,
  ) => CaseController.updateCase(req, res),
);

/**
 * @swagger
 * /cases/{id}/status:
 *   patch:
 *     summary: Update case status
 *     description: Update only the status of an existing case
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCaseStatusRequest'
 *     responses:
 *       200:
 *         description: Case status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Case status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch(
  '/:id/status',
  validateUpdateStatus,
  (
    req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: express.Response<any, Record<string, any>>,
  ) => CaseController.updateCaseStatus(req, res),
);

/**
 * @swagger
 * /cases/{id}:
 *   delete:
 *     summary: Delete a case
 *     description: Delete an existing case by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The case ID
 *     responses:
 *       204:
 *         description: Case deleted successfully (no content)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:id',
  validateDeleteCase,
  (
    req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: express.Response<any, Record<string, any>>,
  ) => CaseController.deleteCase(req, res),
);

export default router;
