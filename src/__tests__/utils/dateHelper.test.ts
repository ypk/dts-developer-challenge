import {
  formatDateTime,
  isValidDate,
  isValidISODateString,
  extractDateComponents,
  DATE,
} from '../../utils/dateHelper.js';

describe('dateHelper', () => {
  describe('formatDateTime', () => {
    it('should return the year for a valid date', () => {
      const result = formatDateTime('2025-07-30', DATE.YEAR);
      expect(result).toBe('2025');
    });

    it('should return the month for a valid date', () => {
      const result = formatDateTime('2025-07-30', DATE.MONTH);
      expect(result).toBe('07');
    });

    it('should return the day for a valid date', () => {
      const result = formatDateTime('2025-07-30', DATE.DAY);
      expect(result).toBe('30');
    });

    it('should return an empty string for an invalid date', () => {
      const result = formatDateTime('invalid-date', DATE.YEAR);
      expect(result).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('should return true for a valid Date object', () => {
      const result = isValidDate(new Date('2025-07-30'));
      expect(result).toBe(true);
    });

    it('should return false for an invalid Date object', () => {
      const result = isValidDate(new Date('invalid-date'));
      expect(result).toBe(false);
    });
  });

  describe('isValidISODateString', () => {
    it('should return true for a valid ISO date string', () => {
      const result = isValidISODateString('2025-07-30T00:00:00.000Z');
      expect(result).toBe(true);
    });

    it('should return false for an invalid ISO date string', () => {
      const result = isValidISODateString('invalid-date');
      expect(result).toBe(false);
    });
  });

  describe('extractDateComponents', () => {
    it('should extract year, month, and day from a valid ISO date string', () => {
      const result = extractDateComponents('2025-07-30T00:00:00.000Z');
      expect(result).toEqual({ year: '2025', month: '07', day: '30' });
    });

    it('should return empty strings for an invalid date', () => {
      const result = extractDateComponents('invalid-date');
      expect(result).toEqual({ year: '', month: '', day: '' });
    });

    it('should handle Date objects correctly', () => {
      const result = extractDateComponents(new Date('2025-07-30T00:00:00.000Z'));
      expect(result).toEqual({ year: '2025', month: '07', day: '30' });
    });
  });
});
