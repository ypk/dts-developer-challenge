import {
  validateAndParseId,
  handleNotFoundError,
  handlePrismaError,
} from '../../utils/caseHelper.ts';

import { sendError, sendBadRequest } from '../../utils/responseHandler.ts';

import {
  NotFoundError,
  DatabaseError,
  isPrismaNotFoundError,
  isPrismaUniqueViolationError,
} from '../../middleware/error.middleware.ts';

// Mock dependencies
jest.mock('../../utils/responseHandler.ts', () => ({
  sendError: jest.fn(),
  sendBadRequest: jest.fn(),
}));

jest.mock('../../middleware/error.middleware', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
  isPrismaNotFoundError: jest.fn(),
  isPrismaUniqueViolationError: jest.fn(),
}));

describe('caseHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndParseId', () => {
    it('should return the parsed ID when valid', () => {
      const req = { params: { id: '123' } } as any;
      const res = {} as any;

      const result = validateAndParseId(req, res);

      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null and send bad request when ID is invalid', () => {
      const req = { params: { id: 'abc' } } as any;
      const res = {} as any;

      const result = validateAndParseId(req, res);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(res, 'Invalid case ID');
    });
  });

  describe('handleNotFoundError', () => {
    it('should return true and send error when error is NotFoundError', () => {
      const error = new NotFoundError('Case not found');
      const res = {} as any;

      const result = handleNotFoundError(error, res);

      expect(result).toBe(true);
      expect(sendError).toHaveBeenCalledWith(res, error.message, error, 404);
    });

    it('should return false when error is not NotFoundError', () => {
      const error = new Error('Generic error');
      const res = {} as any;

      const result = handleNotFoundError(error, res);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });
  });

  describe('handlePrismaError', () => {
    it('should return NotFoundError when Prisma not found error occurs', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);

      const error = new Error('Prisma not found error');
      const result = handlePrismaError(error, 'Case', 'retrieve', 123);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Case with ID 123 not found');
    });

    it('should return DatabaseError when Prisma unique constraint violation occurs', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);

      const error = new Error('Unique constraint violation');
      (error as any).meta = { target: ['title'] };

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Case with the same title already exists');
    });

    it('should return DatabaseError with unknown field when target is not available', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);

      const error = new Error('Unique constraint violation');

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Case with the same unknown field already exists');
    });

    it('should return generic DatabaseError for other Prisma errors', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(false);

      const error = new Error('Some database error');
      const result = handlePrismaError(error, 'Case', 'update', 123);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to update Case: Some database error');
    });

    it('should handle non-Error objects', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(false);

      const error = 'String error'; // Not an Error object
      const result = handlePrismaError(error, 'Case', 'delete', 123);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to delete Case: Unknown error');
    });
  });
});
