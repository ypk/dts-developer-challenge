import {
  getFormData,
  hasError,
  getErrorMessage,
  populateField,
  populateDateComponents,
} from '../../utils/viewHelpers.js';

describe('viewHelpers', () => {
  describe('getFormData', () => {
    it('should return session.formData when session exists and has formData', () => {
      const session = {
        formData: {
          title: 'Test Case',
          description: 'Test description',
          status: 'PENDING',
        },
      };
      const fallbackData = { title: 'Fallback' };

      const result = getFormData(session, fallbackData);

      expect(result).toEqual({
        title: 'Test Case',
        description: 'Test description',
        status: 'PENDING',
      });
    });

    it('should return fallbackData when session.formData is empty object', () => {
      const session = { formData: {} };
      const fallbackData = { title: 'Default Title', description: '', status: 'PENDING' };

      const result = getFormData(session, fallbackData);

      expect(result).toEqual(fallbackData);
    });

    it('should use default empty object when no fallbackData provided', () => {
      const session = undefined;

      const result = getFormData(session);

      expect(result).toEqual({});
    });
  });

  describe('hasError', () => {
    it('should return true when field has error (exact case match)', () => {
      const messages = {
        error: ['Title is required', 'Description must be longer'],
      };

      const result = hasError(messages, 'title');

      expect(result).toBe(true);
    });

    it('should return true when field has error (case insensitive)', () => {
      const messages = {
        error: ['TITLE is required', 'Description must be longer'],
      };

      const result = hasError(messages, 'title');

      expect(result).toBe(true);
    });

    it('should return true when field name is contained in error message', () => {
      const messages = {
        error: ['The title field is required', 'Invalid status value'],
      };

      const result = hasError(messages, 'title');

      expect(result).toBe(true);
    });

    it('should return false when field has no error', () => {
      const messages = {
        error: ['Description is required', 'Status is invalid'],
      };

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should return false when messages is null', () => {
      const messages = null;

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should return false when messages is undefined', () => {
      const messages = undefined;

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should return false when messages has no error property', () => {
      const messages = { success: ['Case created successfully'] };

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should return false when messages.error is null', () => {
      const messages = { error: null };

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should return false when messages.error is empty array', () => {
      const messages = { error: [] };

      const result = hasError(messages, 'title');

      expect(result).toBe(false);
    });

    it('should handle mixed case field names', () => {
      const messages = {
        error: ['DueDate format is invalid'],
      };

      const result = hasError(messages, 'DUEDATE');

      expect(result).toBe(true);
    });

    it('should handle special characters in field names', () => {
      const messages = {
        error: ['user_name is required'],
      };

      const result = hasError(messages, 'user_name');

      expect(result).toBe(true);
    });

    it('should return true for empty field name (matches all errors)', () => {
      const messages = {
        error: ['Title is required', 'Description is required'],
      };

      const result = hasError(messages, '');

      expect(result).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message when field has error (exact match)', () => {
      const messages = {
        error: ['Title is required', 'Description must be longer'],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('Title is required');
    });

    it('should return error message when field has error (case insensitive)', () => {
      const messages = {
        error: ['TITLE is required', 'Description must be longer'],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('TITLE is required');
    });

    it('should return first matching error message when multiple exist', () => {
      const messages = {
        error: [
          'Title is required',
          'Title must be at least 3 characters',
          'Description is invalid',
        ],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('Title is required');
    });

    it('should return empty string when field has no error', () => {
      const messages = {
        error: ['Description is required', 'Status is invalid'],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return empty string when messages is null', () => {
      const messages = null;

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return empty string when messages is undefined', () => {
      const messages = undefined;

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return empty string when messages has no error property', () => {
      const messages = { success: ['Case created successfully'] };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return empty string when messages.error is null', () => {
      const messages = { error: null };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return empty string when messages.error is empty array', () => {
      const messages = { error: [] };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should handle partial field name matches', () => {
      const messages = {
        error: ['The title field cannot be empty', 'Status is required'],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('The title field cannot be empty');
    });

    it('should handle mixed case matching', () => {
      const messages = {
        error: ['DueDate format is invalid', 'Title is required'],
      };

      const result = getErrorMessage(messages, 'DUEDATE');

      expect(result).toBe('DueDate format is invalid');
    });

    it('should return empty string when no exact or partial match found', () => {
      const messages = {
        error: ['Description is too short', 'Status value is invalid'],
      };

      const result = getErrorMessage(messages, 'title');

      expect(result).toBe('');
    });

    it('should return first error for empty field name', () => {
      const messages = {
        error: ['Title is required', 'Description is required'],
      };

      const result = getErrorMessage(messages, '');

      expect(result).toBe('Title is required');
    });
  });

  describe('populateField', () => {
    it('should populate a field with a default value if it is not present', () => {
      const formData: { title?: string } = {};
      const field = 'title';
      const defaultValue = 'Default Title';

      populateField(formData, field, defaultValue);

      expect(formData.title).toBe('Default Title');
    });

    it('should not overwrite an existing field value', () => {
      const formData: { title?: string } = { title: 'Existing Title' };
      const field = 'title';
      const defaultValue = 'Default Title';

      populateField(formData, field, defaultValue);

      expect(formData.title).toBe('Existing Title');
    });
  });

  describe('populateDateComponents', () => {
    it('should populate year, month, and day from a valid dueDate', () => {
      const formData: {
        'dueDate-year'?: string;
        'dueDate-month'?: string;
        'dueDate-day'?: string;
      } = {};
      const dueDate = '2025-07-30T00:00:00.000Z';

      populateDateComponents(formData, dueDate);

      expect(formData['dueDate-year']).toBe('2025');
      expect(formData['dueDate-month']).toBe('07');
      expect(formData['dueDate-day']).toBe('30');
    });

    it('should populate empty strings for an invalid dueDate', () => {
      const formData: {
        'dueDate-year'?: string;
        'dueDate-month'?: string;
        'dueDate-day'?: string;
      } = {};
      const dueDate = 'invalid-date';

      populateDateComponents(formData, dueDate);

      expect(formData['dueDate-year']).toBe('');
      expect(formData['dueDate-month']).toBe('');
      expect(formData['dueDate-day']).toBe('');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle getFormData with non-object session that is not undefined', () => {
      const fallbackData = { test: 'value' };

      expect(getFormData({ formData: false }, fallbackData)).toEqual(fallbackData);
      expect(getFormData({ formData: 0 }, fallbackData)).toEqual(fallbackData);
      expect(getFormData({ formData: '' }, fallbackData)).toEqual(fallbackData);
      expect(getFormData({}, fallbackData)).toEqual(fallbackData);
    });

    it('should handle field names with special characters', () => {
      const messages = {
        error: ['field-name_123 is invalid', 'Another error'],
      };

      expect(hasError(messages, 'field-name_123')).toBe(true);
      expect(getErrorMessage(messages, 'field-name_123')).toBe('field-name_123 is invalid');
    });

    it('should handle messages with non-array error values gracefully', () => {
      const validMessages = {
        error: ['Valid error message'],
      };

      expect(hasError(validMessages, 'error')).toBe(true);
      expect(getErrorMessage(validMessages, 'error')).toBe('Valid error message');
    });

    it('should handle case sensitivity correctly', () => {
      const messages = {
        error: ['Title is REQUIRED', 'description is missing'],
      };

      expect(hasError(messages, 'TITLE')).toBe(true);
      expect(hasError(messages, 'DESCRIPTION')).toBe(true);
      expect(getErrorMessage(messages, 'TITLE')).toBe('Title is REQUIRED');
      expect(getErrorMessage(messages, 'DESCRIPTION')).toBe('description is missing');
    });

    it('should handle whitespace in field names and error messages', () => {
      const messages = {
        error: [' title is required ', 'description field is empty'],
      };

      expect(hasError(messages, 'title')).toBe(true);
      expect(hasError(messages, 'field')).toBe(true);
      expect(getErrorMessage(messages, 'title')).toBe(' title is required ');
    });
  });
});
