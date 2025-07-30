/**
 * Enum representing parts of a date.
 */
export enum DATE {
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
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
