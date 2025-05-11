import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

// Individual validation chains for different operations
export const validateCreateCase = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

export const validateUpdateCase = [
  param('id').isInt().withMessage('Invalid case ID'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional(),
  body('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

export const validateUpdateStatus = [
  param('id').isInt().withMessage('Invalid case ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Invalid status'),
  validate,
];

export const validateDeleteCase = [param('id').isInt().withMessage('Invalid case ID'), validate];

// For backward compatibility
export const caseValidation = {
  create: validateCreateCase.slice(0, -1), // Remove the validate function
  update: validateUpdateCase.slice(0, -1),
  updateStatus: validateUpdateStatus.slice(0, -1),
  delete: validateDeleteCase.slice(0, -1),
};

// Validation result handler
export function validate(req: Request, res: Response, next: NextFunction): void {
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
}
