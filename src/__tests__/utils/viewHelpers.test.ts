import { getFormData, hasError, getErrorMessage } from '../../utils/viewHelpers.ts';

describe('viewHelpers', () => {
  describe('getFormData', () => {
    it('should return formData from session when available', () => {
      const session = { formData: { name: 'John', email: 'john@example.com' } };
      const fallbackData = { name: 'Default', email: 'default@example.com' };

      expect(getFormData(session, fallbackData)).toEqual(session.formData);
    });

    it('should return fallbackData when session is undefined', () => {
      const fallbackData = { name: 'Default', email: 'default@example.com' };

      expect(getFormData(undefined, fallbackData)).toEqual(fallbackData);
    });

    it('should return fallbackData when session has no formData', () => {
      const session = { user: 'John' };
      const fallbackData = { name: 'Default', email: 'default@example.com' };

      expect(getFormData(session, fallbackData)).toEqual(fallbackData);
    });

    it('should return empty object when no fallbackData is provided and session has no formData', () => {
      const session = { user: 'John' };

      expect(getFormData(session)).toEqual({});
    });
  });

  describe('hasError', () => {
    it('should return true when field has an error', () => {
      const messages = {
        error: ['Invalid title', 'Description is too short'],
      };

      expect(hasError(messages, 'title')).toBe(true);
    });

    it('should return false when field has no error', () => {
      const messages = {
        error: ['Description is too short'],
      };

      expect(hasError(messages, 'title')).toBe(false);
    });

    it('should return false when messages is undefined', () => {
      expect(hasError(undefined, 'title')).toBe(false);
    });

    it('should return false when messages.error is undefined', () => {
      const messages = { success: ['Operation successful'] };

      expect(hasError(messages, 'title')).toBe(false);
    });

    it('should handle case insensitivity correctly', () => {
      const messages = {
        error: ['Invalid TITLE format'],
      };

      expect(hasError(messages, 'title')).toBe(true);
      expect(hasError(messages, 'TITLE')).toBe(true);
      expect(hasError(messages, 'Title')).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    it('should return the error message when field has an error', () => {
      const messages = {
        error: ['Invalid title', 'Description is too short'],
      };

      expect(getErrorMessage(messages, 'title')).toBe('Invalid title');
    });

    it('should return empty string when field has no error', () => {
      const messages = {
        error: ['Description is too short'],
      };

      expect(getErrorMessage(messages, 'title')).toBe('');
    });

    it('should return empty string when messages is undefined', () => {
      expect(getErrorMessage(undefined, 'title')).toBe('');
    });

    it('should return empty string when messages.error is undefined', () => {
      const messages = { success: ['Operation successful'] };

      expect(getErrorMessage(messages, 'title')).toBe('');
    });

    it('should handle case insensitivity correctly', () => {
      const messages = {
        error: ['Invalid TITLE format'],
      };

      expect(getErrorMessage(messages, 'title')).toBe('Invalid TITLE format');
      expect(getErrorMessage(messages, 'TITLE')).toBe('Invalid TITLE format');
      expect(getErrorMessage(messages, 'Title')).toBe('Invalid TITLE format');
    });
  });
});
