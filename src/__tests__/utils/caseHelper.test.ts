import { Request, Response } from 'express';
import {
  validateAndParseId,
  handleNotFoundError,
  handlePrismaError,
} from '../../utils/caseHelper.js';
import { sendError, sendBadRequest } from '../../utils/responseHandler.js';
import {
  NotFoundError,
  DatabaseError,
  isPrismaNotFoundError,
  isPrismaUniqueViolationError,
} from '../../middleware/error.middleware.js';

jest.mock('../../utils/responseHandler.ts', () => ({
  sendError: jest.fn(),
  sendBadRequest: jest.fn(),
}));

jest.mock('../../middleware/error.middleware.ts', () => ({
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
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('validateAndParseId', () => {
    it('should return parsed ID when valid integer string is provided', () => {
      mockRequest.params = { id: '123' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return parsed ID for single digit', () => {
      mockRequest.params = { id: '1' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(1);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return parsed ID for large numbers', () => {
      mockRequest.params = { id: '999999' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(999999);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return parsed ID for zero', () => {
      mockRequest.params = { id: '0' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(0);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return parsed ID for negative numbers', () => {
      mockRequest.params = { id: '-5' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(-5);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null and send bad request when ID is not a number', () => {
      mockRequest.params = { id: 'abc' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return null and send bad request when ID is empty string', () => {
      mockRequest.params = { id: '' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return parsed number when ID contains mixed characters', () => {
      mockRequest.params = { id: '12abc' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(12);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null and send bad request when ID is undefined', () => {
      mockRequest.params = { id: undefined as unknown as string };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return null and send bad request when ID is null', () => {
      mockRequest.params = { id: null as unknown as string };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return parsed integer when ID is a float string', () => {
      mockRequest.params = { id: '12.5' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(12);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null and send bad request when ID is NaN string', () => {
      mockRequest.params = { id: 'NaN' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return null and send bad request when ID is Infinity', () => {
      mockRequest.params = { id: 'Infinity' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return parsed ID when ID has leading/trailing spaces', () => {
      mockRequest.params = { id: ' 123 ' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should throw error when params object is missing', () => {
      mockRequest.params = undefined;

      expect(() => {
        validateAndParseId(mockRequest as Request, mockResponse as Response);
      }).toThrow();
    });

    it('should return null and send bad request when id param is missing from params', () => {
      mockRequest.params = {};

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should return parsed number when ID starts with number', () => {
      mockRequest.params = { id: '123xyz' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });

    it('should return null when ID starts with non-numeric character', () => {
      mockRequest.params = { id: 'a123' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should handle special characters at the beginning', () => {
      mockRequest.params = { id: '#123' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBeNull();
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
    });

    it('should handle negative numbers with text', () => {
      mockRequest.params = { id: '-123abc' };

      const result = validateAndParseId(mockRequest as Request, mockResponse as Response);

      expect(result).toBe(-123);
      expect(sendBadRequest).not.toHaveBeenCalled();
    });
  });

  describe('handleNotFoundError', () => {
    it('should return true and send error when error is NotFoundError', () => {
      const error = new NotFoundError('Case not found');

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(true);
      expect(sendError).toHaveBeenCalledWith(mockResponse, 'Case not found', error, 404);
    });

    it('should return true and send error when error is NotFoundError with different message', () => {
      const error = new NotFoundError('User not found');

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(true);
      expect(sendError).toHaveBeenCalledWith(mockResponse, 'User not found', error, 404);
    });

    it('should return false and not send error when error is not NotFoundError', () => {
      const error = new Error('Some other error');

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is DatabaseError', () => {
      const error = new DatabaseError('Database connection failed');

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is string', () => {
      const error = 'String error';

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is number', () => {
      const error = 404;

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is null', () => {
      const error = null;

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is undefined', () => {
      const error = undefined;

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is plain object', () => {
      const error = { message: 'Object error' };

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should return false when error is boolean', () => {
      const error = false;

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(false);
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should handle NotFoundError with empty message', () => {
      const error = new NotFoundError('');

      const result = handleNotFoundError(error, mockResponse as Response);

      expect(result).toBe(true);
      expect(sendError).toHaveBeenCalledWith(mockResponse, '', error, 404);
    });
  });

  describe('handlePrismaError', () => {
    beforeEach(() => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(false);
    });

    it('should return NotFoundError when error is Prisma not found error', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);
      const error = { code: 'P2025' };

      const result = handlePrismaError(error, 'Case', 'find', 123);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Case with ID 123 not found');
      expect(isPrismaNotFoundError).toHaveBeenCalledWith(error);
    });

    it('should return NotFoundError with string identifier', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);
      const error = { code: 'P2025' };

      const result = handlePrismaError(error, 'User', 'find', 'user123');

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('User with ID user123 not found');
    });

    it('should return NotFoundError without identifier', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);
      const error = { code: 'P2025' };

      const result = handlePrismaError(error, 'Case', 'delete');

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Case with ID undefined not found');
    });

    it('should return DatabaseError when error is Prisma unique violation error', () => {
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
      };

      const result = handlePrismaError(error, 'User', 'create', 123);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('User with the same email already exists');
      expect(isPrismaUniqueViolationError).toHaveBeenCalledWith(error);
    });

    it('should return DatabaseError with unknown field when meta target is missing', () => {
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: {},
      };

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Case with the same unknown field already exists');
    });

    it('should return DatabaseError with unknown field when meta is missing', () => {
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = { code: 'P2002' };

      const result = handlePrismaError(error, 'User', 'update');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('User with the same unknown field already exists');
    });

    it('should return DatabaseError with unknown field when target array is empty', () => {
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: { target: [] },
      };

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Case with the same unknown field already exists');
    });

    it('should return DatabaseError with first target field when multiple fields exist', () => {
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: { target: ['email', 'username'] },
      };

      const result = handlePrismaError(error, 'User', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('User with the same email already exists');
    });

    it('should return DatabaseError for unknown Prisma error with Error instance', () => {
      const error = new Error('Connection failed');

      const result = handlePrismaError(error, 'Case', 'update', 456);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to update Case: Connection failed');
    });

    it('should return DatabaseError for unknown error with string', () => {
      const error = 'String error message';

      const result = handlePrismaError(error, 'User', 'delete', 789);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to delete User: Unknown error');
    });

    it('should return DatabaseError for unknown error with object', () => {
      const error = { code: 'CUSTOM_ERROR', message: 'Custom message' };

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to create Case: Unknown error');
    });

    it('should return DatabaseError for unknown error with null', () => {
      const error = null;

      const result = handlePrismaError(error, 'User', 'find', 111);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to find User: Unknown error');
    });

    it('should return DatabaseError for unknown error with undefined', () => {
      const error = undefined;

      const result = handlePrismaError(error, 'Case', 'update');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to update Case: Unknown error');
    });

    it('should return DatabaseError for unknown error with number', () => {
      const error = 500;

      const result = handlePrismaError(error, 'User', 'delete');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to delete User: Unknown error');
    });

    it('should return DatabaseError for unknown error with boolean', () => {
      const error = false;

      const result = handlePrismaError(error, 'Case', 'find');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to find Case: Unknown error');
    });

    it('should handle Error instance with empty message', () => {
      const error = new Error('');

      const result = handlePrismaError(error, 'User', 'create', 222);

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to create User: ');
    });

    it('should handle complex entity names and operations', () => {
      const error = new Error('Database timeout');

      const result = handlePrismaError(error, 'UserProfile', 'updateMany', 'batch123');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Failed to updateMany UserProfile: Database timeout');
    });

    it('should handle all error checking functions being called', () => {
      const error = { code: 'P1000' };

      handlePrismaError(error, 'Case', 'find', 1);

      expect(isPrismaNotFoundError).toHaveBeenCalledWith(error);
      expect(isPrismaUniqueViolationError).toHaveBeenCalledWith(error);
    });

    it('should prioritize NotFoundError over other error types', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = { code: 'P2025' };

      const result = handlePrismaError(error, 'Case', 'find', 1);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toBe('Case with ID 1 not found');
    });

    it('should handle unique violation when not found check returns false', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(false);
      (isPrismaUniqueViolationError as jest.Mock).mockReturnValue(true);
      const error = {
        code: 'P2002',
        meta: { target: ['title'] },
      };

      const result = handlePrismaError(error, 'Case', 'create');

      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Case with the same title already exists');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow with valid ID and no errors', () => {
      mockRequest.params = { id: '123' };
      const notFoundError = new Error('Regular error');

      const parsedId = validateAndParseId(mockRequest as Request, mockResponse as Response);
      const handled = handleNotFoundError(notFoundError, mockResponse as Response);

      expect(parsedId).toBe(123);
      expect(handled).toBe(false);
      expect(sendBadRequest).not.toHaveBeenCalled();
      expect(sendError).not.toHaveBeenCalled();
    });

    it('should handle complete workflow with invalid ID', () => {
      mockRequest.params = { id: 'invalid' };
      const notFoundError = new NotFoundError('Not found');

      const parsedId = validateAndParseId(mockRequest as Request, mockResponse as Response);
      const handled = handleNotFoundError(notFoundError, mockResponse as Response);

      expect(parsedId).toBeNull();
      expect(handled).toBe(true);
      expect(sendBadRequest).toHaveBeenCalledWith(mockResponse, 'Invalid case ID');
      expect(sendError).toHaveBeenCalledWith(mockResponse, 'Not found', notFoundError, 404);
    });

    it('should handle Prisma error workflow', () => {
      (isPrismaNotFoundError as jest.Mock).mockReturnValue(true);
      const prismaError = { code: 'P2025' };

      const error = handlePrismaError(prismaError, 'Case', 'delete', 999);
      const handled = handleNotFoundError(error, mockResponse as Response);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(handled).toBe(true);
      expect(sendError).toHaveBeenCalledWith(
        mockResponse,
        'Case with ID 999 not found',
        error,
        404,
      );
    });
  });
});
