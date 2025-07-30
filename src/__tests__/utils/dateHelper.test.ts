import {
  formatDateTime,
  isValidDate,
  isValidISODateString,
  extractDateComponents,
  DATE,
} from '../../utils/dateHelper.js';

describe('formatDateTime', () => {
  it('returns year, month, and day for a valid date string', () => {
    expect(formatDateTime('2025-07-30', DATE.YEAR)).toBe('2025');
    expect(formatDateTime('2025-07-30', DATE.MONTH)).toBe('07');
    expect(formatDateTime('2025-07-30', DATE.DAY)).toBe('30');
  });

  it('returns an empty string for an invalid date string', () => {
    expect(formatDateTime('invalid-date', DATE.YEAR)).toBe('');
  });

  it('calls console.error for an invalid date string', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    formatDateTime('invalid-date', DATE.YEAR);
    expect(spy).toHaveBeenCalledWith('Invalid date provided:', 'invalid-date');
    spy.mockRestore();
  });

  it('returns an empty string and calls console.error for a non-Date object', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = formatDateTime({ foo: 1 } as any, DATE.YEAR);
    expect(result).toBe('');
    expect(spy).toHaveBeenCalledWith('Invalid date provided:', { foo: 1 });
    spy.mockRestore();
  });

  it('returns an empty string for an unknown part', () => {
    expect(formatDateTime('2025-07-30', 'not-a-part' as DATE)).toBe('');
  });
});

describe('isValidDate', () => {
  it('returns true for a valid Date object', () => {
    expect(isValidDate(new Date('2025-07-30'))).toBe(true);
  });
  it('returns false for an invalid Date object', () => {
    expect(isValidDate(new Date('invalid-date'))).toBe(false);
  });
});

describe('isValidISODateString', () => {
  it('returns true for a valid ISO date string', () => {
    expect(isValidISODateString('2025-07-30T00:00:00.000Z')).toBe(true);
  });
  it('returns false for an invalid ISO date string', () => {
    expect(isValidISODateString('invalid-date')).toBe(false);
  });
});

describe('extractDateComponents', () => {
  it('extracts year, month, and day from a valid ISO date string', () => {
    expect(extractDateComponents('2025-07-30T00:00:00.000Z')).toEqual({
      year: '2025',
      month: '07',
      day: '30',
    });
  });
  it('returns empty strings for an invalid date', () => {
    expect(extractDateComponents('invalid-date')).toEqual({ year: '', month: '', day: '' });
  });
  it('handles Date objects correctly', () => {
    expect(extractDateComponents(new Date('2025-07-30T00:00:00.000Z'))).toEqual({
      year: '2025',
      month: '07',
      day: '30',
    });
  });
});
