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
import { dueDateCustomValidator } from '../../utils/dateHelper.js';
import { mockRequest, mockResponse, mockNext } from '../../__mocks__/express.js';
import { validationResult } from 'express-validator';

describe('validateFutureDate', () => {
  it('returns true if value is falsy', () => {
    expect(validateFutureDate('')).toBe(true);
    expect(validateFutureDate(undefined as any)).toBe(true);
  });
  it('returns true for a valid future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(validateFutureDate(futureDate.toISOString())).toBe(true);
  });

  it('throws an error for a past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(() => validateFutureDate(pastDate.toISOString())).toThrow(
      'Due date cannot be in the past',
    );
  });
});

describe('validateForm', () => {
  it('sets req.session.formData on validation error', () => {
    const mockErrors = {
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ msg: 'Error message' }]),
    };
    (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);
    mockRequest.flash = jest.fn();
    Object.defineProperty(mockRequest, 'path', { value: '/some/path', configurable: true });
    mockRequest.params = {};
    (mockRequest.session as any).formData = undefined;

    validateForm(mockRequest, mockResponse, mockNext);

    expect((mockRequest.session as any).formData).toEqual(mockRequest.body);
  });
  beforeEach(() => {
    mockNext.mockClear();
  });
  it('deletes req.session.formData if present and calls next', () => {
    const mockErrors = {
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    };
    (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);
    Object.defineProperty(mockRequest, 'path', { value: '/some/path', configurable: true });
    mockRequest.params = {};
    (mockRequest.session as any).formData = { foo: 'bar' };

    validateForm(mockRequest, mockResponse, mockNext);

    expect((mockRequest.session as any).formData).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
  beforeEach(() => {
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

  it('calls next when no validation errors', () => {
    const mockErrors = {
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    };
    (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);
    Object.defineProperty(mockRequest, 'path', { value: '/some/path', configurable: true });
    mockRequest.params = {};
    mockResponse.redirect = jest.fn();

    validateForm(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects with errors when validation fails and path is not /cases and no id', () => {
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

  it('redirects to /cases/new when path is /cases', () => {
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

  it('redirects to /cases/:id/edit when params.id is present', () => {
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
  beforeEach(() => {
    mockNext.mockClear();
  });
  it('calls next when no validation errors', () => {
    const mockErrors = {
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    };
    (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

    validate(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('returns 400 with error details when validation errors exist', () => {
    const mockErrors = {
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ param: 'field', msg: 'Error message' }]),
    };
    (validationResult as unknown as jest.Mock).mockReturnValue(mockErrors);

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
  it('defines validation chains for all operations', () => {
    expect(caseValidation.create).toBeDefined();
    expect(caseValidation.update).toBeDefined();
    expect(caseValidation.delete).toBeDefined();
    expect(caseValidation.webForm).toBeDefined();
  });

  describe('webForm dueDate custom validator', () => {
    it('throws if only day is present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: { body: { 'dueDate-day': '10' } } }),
      ).toThrow('The due date must include month, year');
    });
    it('throws if only month is present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: { body: { 'dueDate-month': '12' } } }),
      ).toThrow('The due date must include day, year');
    });
    it('throws if only year is present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: { body: { 'dueDate-year': '2025' } } }),
      ).toThrow('The due date must include day, month');
    });
    it('throws if day and month are present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: { body: { 'dueDate-day': '10', 'dueDate-month': '12' } },
        }),
      ).toThrow('The due date must include year');
    });
    it('throws if day and year are present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: { body: { 'dueDate-day': '10', 'dueDate-year': '2025' } },
        }),
      ).toThrow('The due date must include month');
    });
    it('throws if month and year are present and valid', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: { body: { 'dueDate-month': '12', 'dueDate-year': '2025' } },
        }),
      ).toThrow('The due date must include day');
    });
    function makeReq(body: any) {
      return { body };
    }

    it('throws if all fields are missing', () => {
      expect(() => dueDateCustomValidator(undefined, { req: makeReq({}) })).toThrow(
        'The due date must include day, month, year',
      );
    });
    it('throws if day is missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-month': '12', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include day');
    });
    it('throws if month is missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include month');
    });
    it('throws if year is missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': '12' }),
        }),
      ).toThrow('The due date must include year');
    });
    it('throws if day and month are missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: makeReq({ 'dueDate-year': '2025' }) }),
      ).toThrow('The due date must include day, month');
    });
    it('throws if day and year are missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: makeReq({ 'dueDate-month': '12' }) }),
      ).toThrow('The due date must include day, year');
    });
    it('throws if month and year are missing', () => {
      expect(() =>
        dueDateCustomValidator(undefined, { req: makeReq({ 'dueDate-day': '10' }) }),
      ).toThrow('The due date must include month, year');
    });
    it('throws if day is not numeric', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': 'xx', 'dueDate-month': '12', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include day');
    });
    it('throws if month is not numeric', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': 'xx', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include month');
    });
    it('throws if year is not numeric', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': '12', 'dueDate-year': 'xxxx' }),
        }),
      ).toThrow('The due date must include year');
    });
    it('throws if day is out of range', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '32', 'dueDate-month': '12', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include day');
    });
    it('throws if month is out of range', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': '13', 'dueDate-year': '2025' }),
        }),
      ).toThrow('The due date must include month');
    });
    it('throws if year is not 4 digits', () => {
      expect(() =>
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': '12', 'dueDate-year': '25' }),
        }),
      ).toThrow('The due date must include year');
    });
    it('returns true for valid day, month, year', () => {
      expect(
        dueDateCustomValidator(undefined, {
          req: makeReq({ 'dueDate-day': '10', 'dueDate-month': '12', 'dueDate-year': '2025' }),
        }),
      ).toBe(true);
    });
  });
});
