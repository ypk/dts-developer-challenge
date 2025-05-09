import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

export const caseValidation = {
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],

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

  updateStatus: [
    param('id').isInt().withMessage('Invalid case ID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
      .withMessage('Invalid status'),
  ],

  delete: [param('id').isInt().withMessage('Invalid case ID')],
};

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
