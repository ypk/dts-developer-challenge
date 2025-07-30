/**
 * Enum representing parts of a date.
 */
export enum DATE {
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
}

/**
 * Extracts due date fields (day, month, year) from the request body.
 * @param req - Express request object
 * @returns An object with day, month, and year properties
 */
function getDueDateFields(req: any) {
  return {
    day: req.body['dueDate-day'],
    month: req.body['dueDate-month'],
    year: req.body['dueDate-year'],
  };
}

/**
 * Returns an array of missing due date fields.
 * @param fields - Object with day, month, year properties
 * @returns Array of field names that are missing (empty or falsy)
 */
function getMissingFields(fields: { day: string; month: string; year: string }) {
  return Object.entries(fields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
}

/**
 * Returns an array of invalid due date fields (present but not valid).
 * @param fields - Object with day, month, year properties
 * @returns Array of field names that are present but invalid
 */
function getInvalidFields(fields: { day: string; month: string; year: string }) {
  const invalid: string[] = [];
  if (fields.day && (!/^[0-9]+$/.test(fields.day) || +fields.day < 1 || +fields.day > 31))
    invalid.push('day');
  if (fields.month && (!/^[0-9]+$/.test(fields.month) || +fields.month < 1 || +fields.month > 12))
    invalid.push('month');
  if (fields.year && (!/^[0-9]+$/.test(fields.year) || fields.year.length !== 4))
    invalid.push('year');
  return invalid;
}

/**
 * Builds an error message for missing and/or invalid due date fields.
 * @param missing - Array of missing field names
 * @param invalid - Array of invalid field names
 * @returns Error message string or null if no error
 */
function buildDueDateError(missing: string[], invalid: string[]) {
  if (missing.length === 3) return 'The due date must include day, month, year';
  const all = Array.from(new Set([...missing, ...invalid]));
  if (all.length > 0) return `The due date must include ${all.join(', ')}`;
  return null;
}

/**
 * Formats a date and extracts a specific part (year, month, or day).
 * @param {string | Date} date - The date to format (can be a string or Date object).
 * @param {DATE} part - The part of the date to extract (YEAR, MONTH, DAY).
 * @returns {string} The extracted part of the date as a string, or an empty string if invalid.
 */
export const formatDateTime = (date: string | Date, part: DATE): string => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (!isValidDate(parsedDate)) {
    console.error('Invalid date provided:', date);
    return '';
  }

  const dateParts = {
    [DATE.YEAR]: parsedDate.getUTCFullYear().toString(),
    [DATE.MONTH]: (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0'),
    [DATE.DAY]: parsedDate.getUTCDate().toString().padStart(2, '0'),
  };

  return dateParts[part] || '';
};

/**
 * Checks if a given value is a valid Date object.
 * @param {any} date - The value to check.
 * @returns {boolean} True if the value is a valid Date object, false otherwise.
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validates if a string is in ISO 8601 date format.
 * @param {string} dateString - The string to validate.
 * @returns {boolean} True if the string is a valid ISO 8601 date, false otherwise.
 */
export const isValidISODateString = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
};

/**
 * Extracts the year, month, and day components from a date string or Date object.
 * @param {any} dateString - The date to extract components from (can be a string or Date object).
 * @returns {Object} An object containing the year, month, and day as strings, or empty strings if invalid.
 */
export const extractDateComponents = (
  dateString: any,
): { year: string; month: string; day: string } => {
  if (typeof dateString === 'object' && dateString instanceof Date) {
    dateString = dateString.toISOString();
  }

  if (typeof dateString === 'string') {
    const [datePart] = dateString.split('T');
    if (datePart) {
      const [year, month, day] = datePart.split('-');
      if (year && month && day) {
        return { year, month, day };
      }
    }
  }

  return { year: '', month: '', day: '' };
};

/**
 * Custom validator for due date fields (day, month, year) in web forms.
 * Throws if all fields are missing or if any field is invalid.
 * @param _ - Unused value (for express-validator compatibility)
 * @param context - Context object containing req with body
 * @returns {boolean} True if valid, otherwise throws an error
 */
export const dueDateCustomValidator = (_: any, { req }: { req: any }) => {
  const fields = getDueDateFields(req);
  const missing = getMissingFields(fields);
  const invalid = getInvalidFields(fields);
  const errorMsg = buildDueDateError(missing, invalid);
  if (errorMsg) throw new Error(errorMsg);
  return true;
};
