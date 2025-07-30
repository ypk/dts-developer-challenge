// Mock express-validator's validationResult so the middleware uses our mock
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  validationResult: jest.fn(),
}));

import {
  validateFutureDate,
  validateForm,
  validate,
  caseValidation,
} from '../../middleware/validation.middleware.js';
import { mockRequest, mockResponse, mockNext } from '../../__mocks__/express.js';
import { validationResult } from 'express-validator';

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFutureDate', () => {
    it('should return true for a valid future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(validateFutureDate(futureDate.toISOString())).toBe(true);
    });

    it('should throw an error for a past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(() => validateFutureDate(pastDate.toISOString())).toThrow(
        'Due date cannot be in the past',
      );
    });
  });

  describe('validateForm', () => {
    beforeEach(() => {
      // Reset session to an object with required session methods and properties
      mockRequest.session = {
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        save: jest.fn(),
        touch: jest.fn(),
        resetMaxAge: jest.fn(),
        id: 'mock-session-id',
        cookie: { originalMaxAge: null },
      };
      mockRequest.flash = jest.fn();
    });
    it('should call next when no validation errors', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      // Reset path and params to default using defineProperty for read-only
      Object.defineProperty(mockRequest, 'path', { value: '/some/path', configurable: true });
      mockRequest.params = {};

      validateForm(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect with errors when validation fails and path is not /cases and no id', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      mockRequest.flash = jest.fn();
      Object.defineProperty(mockRequest, 'path', { value: '/some/path', configurable: true });
      mockRequest.params = {};

      validateForm(mockRequest, mockResponse, mockNext);

      expect(mockRequest.flash).toHaveBeenCalledWith('error', ['Error message']);
      expect(mockResponse.redirect).toHaveBeenCalledWith('back');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect to /cases/new when path is /cases', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      mockRequest.flash = jest.fn();
      Object.defineProperty(mockRequest, 'path', { value: '/cases', configurable: true });
      mockRequest.params = {};

      validateForm(mockRequest, mockResponse, mockNext);

      expect(mockRequest.flash).toHaveBeenCalledWith('error', ['Error message']);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/new');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect to /cases/:id/edit when params.id is present', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error message' }]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      mockRequest.flash = jest.fn();
      Object.defineProperty(mockRequest, 'path', { value: '/any/path', configurable: true });
      mockRequest.params = { id: '123' };

      validateForm(mockRequest, mockResponse, mockNext);

      expect(mockRequest.flash).toHaveBeenCalledWith('error', ['Error message']);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/cases/123/edit');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should call next when no validation errors', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      validate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 with error details when validation errors exist', () => {
      const mockErrors = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ param: 'field', msg: 'Error message' }]),
      };
      (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

      // Ensure status and json are mocks
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn();

      validate(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ param: 'field', msg: 'Error message' }],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('caseValidation', () => {
    it('should define validation chains for all operations', () => {
      expect(caseValidation.create).toBeDefined();
      expect(caseValidation.update).toBeDefined();
      expect(caseValidation.delete).toBeDefined();
    });
  });
});
