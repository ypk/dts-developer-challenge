import { NotFoundError, ValidationError, DatabaseError } from '../../utils/errorHandler.ts';

describe('Error Handler', () => {
  describe('NotFoundError', () => {
    it('should create an error with the correct name and message', () => {
      const errorMessage = 'Resource not found';
      const error = new NotFoundError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(errorMessage);
    });
  });

  describe('ValidationError', () => {
    it('should create an error with the correct name and message', () => {
      const errorMessage = 'Invalid input data';
      const error = new ValidationError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(errorMessage);
    });
  });

  describe('DatabaseError', () => {
    it('should create an error with the correct name and message', () => {
      const errorMessage = 'Database connection failed';
      const error = new DatabaseError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe(errorMessage);
    });
  });
});
