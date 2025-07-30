/**
 * Validation Middleware Module
 * @module validationMiddleware
 * @description Provides validation rules and middleware for request validation using express-validator
 */
import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

/**
 * Validates that a given date is not in the past
 * @param {string} value - The date string to validate
 * @returns {boolean} True if the date is valid (not in the past), otherwise throws an error
 * @throws {Error} If the date is in the past
 * @description Checks if the provided date is greater than or equal to today's date
 */
export const validateFutureDate = (value: string): boolean => {
  if (value) {
    const dueDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      throw new Error('Due date cannot be in the past');
    }
  }
  return true;
};

/**
 * Express middleware that validates form submissions and handles validation errors
 * @function validateForm
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @description Checks for validation errors, adds error messages to flash session,
 * stores form data for repopulation, and redirects to appropriate form or continues request processing
 */
export const validateForm = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);

    req.flash('error', errorMessages);

    (req.session as any).formData = req.body;

    const caseId = req.params.id;

    if (req.path === '/cases') {
      return res.redirect('/cases/new');
    } else if (caseId) {
      return res.redirect(`/cases/${caseId}/edit`);
    } else {
      return res.redirect('back');
    }
  }

  if ((req.session as any).formData) {
    delete (req.session as any).formData;
  }

  next();
};

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
    body('description').optional().trim(),
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
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
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
  webForm: [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('dueDate').custom((_, { req }) => {
      const day = req.body['dueDate-day'];
      const month = req.body['dueDate-month'];
      const year = req.body['dueDate-year'];

      const isNumeric = (val: string) => /^[0-9]+$/.test(val);

      if (day || month || year) {
        const errors = [];

        if (day && (!isNumeric(day) || parseInt(day, 10) < 1 || parseInt(day, 10) > 31)) {
          errors.push('day');
        }
        if (month && (!isNumeric(month) || parseInt(month, 10) < 1 || parseInt(month, 10) > 12)) {
          errors.push('month');
        }
        if (year && (!isNumeric(year) || year.length !== 4)) {
          errors.push('year');
        }

        if (!day) {
          errors.push('day');
        }
        if (!month) {
          errors.push('month');
        }
        if (!year) {
          errors.push('year');
        }

        if (errors.length > 0) {
          throw new Error(`The due date must include ${errors.join(', ')}`);
        }
      }

      return true;
    }),
  ],
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
