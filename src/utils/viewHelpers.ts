/**
 * View helper utilities for EJS templates
 */

/**
 * Gets form data from session if available or falls back to provided data
 * @param {Object} session - Express session object
 * @param {Object} fallbackData - Data to use if no session data exists
 * @returns {Object} Form data to use in the template
 */
export const getFormData = (session: any, fallbackData: any = {}): any => {
  return typeof session !== 'undefined' && session.formData ? session.formData : fallbackData;
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
