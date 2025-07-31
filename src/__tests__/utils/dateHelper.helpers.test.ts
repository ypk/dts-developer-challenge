import {
  getDueDateFields,
  getMissingFields,
  getInvalidFields,
  buildDueDateError,
} from '../../utils/dateHelper.js';

describe('getDueDateFields', () => {
  it('extracts all fields from request body', () => {
    const req = { body: { 'dueDate-day': '10', 'dueDate-month': '12', 'dueDate-year': '2025' } };
    expect(getDueDateFields(req)).toEqual({ day: '10', month: '12', year: '2025' });
  });
  it('returns empty strings if fields are missing', () => {
    const req = { body: {} };
    expect(getDueDateFields(req)).toEqual({ day: undefined, month: undefined, year: undefined });
  });
});

describe('getMissingFields', () => {
  it('returns all fields if all are missing', () => {
    expect(getMissingFields({ day: '', month: '', year: '' })).toEqual(['day', 'month', 'year']);
  });
  it('returns only missing fields', () => {
    expect(getMissingFields({ day: '10', month: '', year: '' })).toEqual(['month', 'year']);
  });
  it('returns empty array if none are missing', () => {
    expect(getMissingFields({ day: '10', month: '12', year: '2025' })).toEqual([]);
  });
});

describe('getInvalidFields', () => {
  it('returns empty array if all fields are valid', () => {
    expect(getInvalidFields({ day: '10', month: '12', year: '2025' })).toEqual([]);
  });
  it('detects invalid day', () => {
    expect(getInvalidFields({ day: '32', month: '12', year: '2025' })).toEqual(['day']);
    expect(getInvalidFields({ day: '0', month: '12', year: '2025' })).toEqual(['day']);
    expect(getInvalidFields({ day: 'xx', month: '12', year: '2025' })).toEqual(['day']);
  });
  it('detects invalid month', () => {
    expect(getInvalidFields({ day: '10', month: '13', year: '2025' })).toEqual(['month']);
    expect(getInvalidFields({ day: '10', month: '0', year: '2025' })).toEqual(['month']);
    expect(getInvalidFields({ day: '10', month: 'xx', year: '2025' })).toEqual(['month']);
  });
  it('detects invalid year', () => {
    expect(getInvalidFields({ day: '10', month: '12', year: '25' })).toEqual(['year']);
    expect(getInvalidFields({ day: '10', month: '12', year: 'xxxx' })).toEqual(['year']);
    expect(getInvalidFields({ day: '10', month: '12', year: '202' })).toEqual(['year']);
  });
  it('detects multiple invalid fields', () => {
    expect(getInvalidFields({ day: 'xx', month: 'xx', year: 'xx' })).toEqual([
      'day',
      'month',
      'year',
    ]);
  });
});

describe('buildDueDateError', () => {
  it('returns null if no missing or invalid fields', () => {
    expect(buildDueDateError([], [])).toBeNull();
  });
  it('returns full message if all fields are missing', () => {
    expect(buildDueDateError(['day', 'month', 'year'], [])).toBe(
      'The due date must include day, month, year',
    );
  });
  it('returns message for missing fields', () => {
    expect(buildDueDateError(['day'], [])).toBe('The due date must include day');
    expect(buildDueDateError(['day', 'month'], [])).toBe('The due date must include day, month');
  });
  it('returns message for invalid fields', () => {
    expect(buildDueDateError([], ['day'])).toBe('The due date must include day');
    expect(buildDueDateError([], ['day', 'month'])).toBe('The due date must include day, month');
  });
  it('returns message for both missing and invalid fields (deduped)', () => {
    expect(buildDueDateError(['day'], ['day', 'month'])).toBe(
      'The due date must include day, month',
    );
  });
});
