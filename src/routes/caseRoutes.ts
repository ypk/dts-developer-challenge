/**
 * Case Routes Module
 * @module caseRoutes
 * @description Defines API routes for case management operations
 */

import { Router } from 'express';
import { CaseControllerInstance } from '../controllers/CaseController.js';
import { caseValidation, validate } from '../middleware/validation.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';

/**
 * Express router for case-related endpoints
 * @type {Router}
 */
const router = Router();

/**
 * @swagger
 * /cases:
 *   get:
 *     summary: Get all cases
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: The number of items per page
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
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * Route to retrieve all cases with optional pagination
 * @name GET /cases
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.get('/', paginationMiddleware, CaseControllerInstance.getAllCases);

/**
 * @swagger
 * /cases/{id}:
 *   get:
 *     summary: Get a case by ID
 *     tags: [Cases]
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
/**
 * Route to retrieve a specific case by ID
 * @name GET /cases/:id
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object with case ID in params
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.get('/:id', caseValidation.delete, validate, CaseControllerInstance.getCaseById);

/**
 * @swagger
 * /cases:
 *   post:
 *     summary: Create a new case
 *     tags: [Cases]
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
/**
 * Route to create a new case
 * @name POST /cases
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object with case data in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.post('/', caseValidation.create, validate, CaseControllerInstance.createCase);

/**
 * @swagger
 * /cases/{id}:
 *   put:
 *     summary: Update a case
 *     tags: [Cases]
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
/**
 * Route to update an existing case
 * @name PUT /cases/:id
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object with case ID in params and update data in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.put('/:id', caseValidation.update, validate, CaseControllerInstance.updateCase);

/**
 * @swagger
 * /cases/{id}/status:
 *   patch:
 *     summary: Update a case status
 *     tags: [Cases]
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
/**
 * Route to update only the status of an existing case
 * @name PATCH /cases/:id/status
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object with case ID in params and status in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.patch(
  '/:id/status',
  caseValidation.updateStatus,
  validate,
  CaseControllerInstance.updateCaseStatus,
);

/**
 * @swagger
 * /cases/{id}:
 *   delete:
 *     summary: Delete a case
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The case ID
 *     responses:
 *       204:
 *         description: Case deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * Route to delete a case
 * @name DELETE /cases/:id
 * @function
 * @memberof module:caseRoutes
 * @inner
 * @param {Object} req - Express request object with case ID in params
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Promise representing the completion of the request handling
 */
router.delete('/:id', caseValidation.delete, validate, CaseControllerInstance.deleteCase);

export default router;
