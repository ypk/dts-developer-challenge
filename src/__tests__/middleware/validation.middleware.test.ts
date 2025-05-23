import { Request, Response } from 'express';
import { caseValidation, validate } from '../../middleware/validation.middleware.ts';

jest.mock('express-validator', () => {
  const createChainableMock = (prefix = '') => {
    const chainable = {
      withMessage: jest.fn().mockImplementation((message) => {
        return {
          ...chainable,
          _message: message,
          _chain: [...(chainable._chain || []), `withMessage:${message}`],
        };
      }),
      notEmpty: jest.fn().mockImplementation(() => {
        return { ...chainable, _chain: [...(chainable._chain || []), 'notEmpty'] };
      }),
      isIn: jest.fn().mockImplementation((values) => {
        return {
          ...chainable,
          _values: values,
          _chain: [...(chainable._chain || []), `isIn:${values.join(',')}`],
        };
      }),
      isISO8601: jest.fn().mockImplementation(() => {
        return { ...chainable, _chain: [...(chainable._chain || []), 'isISO8601'] };
      }),
      optional: jest.fn().mockImplementation((options) => {
        return {
          ...chainable,
          _chain: [...(chainable._chain || []), 'optional'],
          // Add trim method to the result of optional()
          trim: jest.fn().mockImplementation(() => {
            return { ...chainable, _chain: [...(chainable._chain || []), 'trim'] };
          }),
        };
      }),
      isInt: jest.fn().mockImplementation(() => {
        return { ...chainable, _chain: [...(chainable._chain || []), 'isInt'] };
      }),
      // Add trim method to the top level chainable object
      trim: jest.fn().mockImplementation(() => {
        return { ...chainable, _chain: [...(chainable._chain || []), 'trim'] };
      }),
      _chain: prefix ? [prefix] : [],
    };
    return chainable;
  };

  return {
    body: jest.fn().mockImplementation((field) => {
      return createChainableMock(`body:${field}`);
    }),
    param: jest.fn().mockImplementation((field) => {
      return createChainableMock(`param:${field}`);
    }),
    validationResult: jest.fn(),
  };
});

describe('Validation Middleware', () => {
  describe('caseValidation', () => {
    it('should export validation chains for different operations', () => {
      expect(caseValidation.create).toBeDefined();
      expect(caseValidation.update).toBeDefined();
      expect(caseValidation.updateStatus).toBeDefined();
      expect(caseValidation.delete).toBeDefined();

      expect(Array.isArray(caseValidation.create)).toBe(true);
      expect(Array.isArray(caseValidation.update)).toBe(true);
      expect(Array.isArray(caseValidation.updateStatus)).toBe(true);
      expect(Array.isArray(caseValidation.delete)).toBe(true);
    });
  });

  describe('validate middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should call next() when there are no validation errors', () => {
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      };

      (require('express-validator').validationResult as jest.Mock).mockReturnValue(
        mockValidationResult,
      );

      validate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockValidationResult.isEmpty).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 400 with error details when there are validation errors', () => {
      const mockErrors = [
        { param: 'title', msg: 'Title is required' },
        { param: 'status', msg: 'Invalid status' },
      ];

      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors),
      };

      (require('express-validator').validationResult as jest.Mock).mockReturnValue(
        mockValidationResult,
      );

      validate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockValidationResult.isEmpty).toHaveBeenCalled();
      expect(mockValidationResult.array).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors,
      });
    });
  });
});
