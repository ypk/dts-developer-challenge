/**
 * Validation Middleware Module
 * @module validationMiddleware
 * @description Provides validation rules and middleware for request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

/**
 * Collection of validation rules for case operations
 * @namespace caseValidation
 */
export const caseValidation = {
  /**
   * Validation rules for creating a new case
   * @type {Array<import('express-validator').ValidationChain>}
   * @memberof caseValidation
   * @property {ValidationChain} title - Validates that title exists
   * @property {ValidationChain} description - Optional description field
   * @property {ValidationChain} status - Optional status must be one of the allowed values
   * @property {ValidationChain} dueDate - Optional date in ISO8601 format
   */
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],

  /**
   * Validation rules for updating a case
   * @type {Array<import('express-validator').ValidationChain>}
   * @memberof caseValidation
   * @property {ValidationChain} id - Validates case ID as integer
   * @property {ValidationChain} title - Optional title cannot be empty if provided
   * @property {ValidationChain} description - Optional description field
   * @property {ValidationChain} status - Optional status must be one of the allowed values
   * @property {ValidationChain} dueDate - Optional date in ISO8601 format
   */
  update: [
    param('id').isInt().withMessage('Invalid case ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional(),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],

  /**
   * Validation rules for updating only a case's status
   * @type {Array<import('express-validator').ValidationChain>}
   * @memberof caseValidation
   * @property {ValidationChain} id - Validates case ID as integer
   * @property {ValidationChain} status - Required status must be one of the allowed values
   */
  updateStatus: [
    param('id').isInt().withMessage('Invalid case ID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
  ],

  /**
   * Validation rules for deleting a case
   * @type {Array<import('express-validator').ValidationChain>}
   * @memberof caseValidation
   * @property {ValidationChain} id - Validates case ID as integer
   */
  delete: [param('id').isInt().withMessage('Invalid case ID')],
};

/**
 * Express middleware that validates requests using express-validator
 * @function validate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description Checks for validation errors and returns a 400 response if any are found,
 * otherwise calls next() to continue processing the request
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};
