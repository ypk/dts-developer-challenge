import { extractDateComponents } from './dateHelper.js';

/**
 * Populates a field with a default value if it is not present.
 * @param {Object} formData - The form data object.
 * @param {string} field - The field to populate.
 * @param {any} defaultValue - The default value to use if the field is not present.
 * @returns {void}
 */
export function populateField(
  formData: Record<string, any>,
  field: string,
  defaultValue: string,
): void {
  if (!formData[field]) {
    formData[field] = defaultValue;
  }
}

/**
 * Populates date components (year, month, day) in the form data.
 * @param {Object} formData - The form data object.
 * @param {string} dueDate - The due date string to extract components from.
 * @returns {void}
 */
export function populateDateComponents(formData: Record<string, any>, dueDate: string): void {
  const { year, month, day } = extractDateComponents(dueDate);
  formData['dueDate-year'] = year;
  formData['dueDate-month'] = month;
  formData['dueDate-day'] = day;
}

/**
 * Gets form data from session if available or falls back to provided data
 * @param {Object} session - Express session object
 * @param {Object} fallbackData - Data to use if no session data exists
 * @returns {Object} Form data to use in the template
 */
export const getFormData = (session: any, fallbackData: any = {}): any => {
  if (!session || !session.formData) {
    return { ...fallbackData };
  }

  const formData = session.formData;

  // Ensure only properties from fallbackData are added to formData
  const sanitizedData = { ...fallbackData };
  for (const key in sanitizedData) {
    if (!formData[key]) {
      formData[key] = sanitizedData[key];
    }
  }

  return { ...formData };
};

/**
 * Checks if a field has a validation error
 * @param {Object} messages - Flash messages object
 * @param {string} fieldName - Name of the field to check
 * @returns {boolean} True if the field has an error
 */
export const hasError = (messages: any, fieldName: string): boolean => {
  return !!(
    messages &&
    messages.error &&
    messages.error.some((msg: string) => msg.toLowerCase().includes(fieldName.toLowerCase()))
  );
};

/**
 * Gets the error message for a specific field
 * @param {Object} messages - Flash messages object
 * @param {string} fieldName - Name of the field to check
 * @returns {string} Error message for the field or empty string
 */
export const getErrorMessage = (messages: any, fieldName: string): string => {
  if (!messages || !messages.error) return '';

  const error = messages.error.find((msg: string) =>
    msg.toLowerCase().includes(fieldName.toLowerCase()),
  );

  return error || '';
};
