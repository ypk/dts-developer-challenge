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

/**
 * Extracts the due date fields (day, month, year) from formData.
 * @param {any} formData - The form data object
 * @returns {[any, any, any]} Array containing day, month, year values
 */
const getDueDateFields = (formData?: any): [any, any, any] => [
  formData && formData['dueDate-day'],
  formData && formData['dueDate-month'],
  formData && formData['dueDate-year'],
];

/**
 * Checks if any due date field (day, month, year) is filled in.
 * @param {any} formData - The form data object
 * @returns {boolean} True if at least one field is filled
 */
const anyDueDateFieldFilled = (formData?: any): boolean => {
  const [day, month, year] = getDueDateFields(formData);
  return !!(day || month || year);
};

/**
 * Checks if all due date fields (day, month, year) are empty (undefined, null, or '').
 * @param {any} formData - The form data object
 * @returns {boolean} True if all fields are empty
 */
const allDueDateFieldsEmpty = (formData?: any): boolean => {
  const [day, month, year] = getDueDateFields(formData);
  return [day, month, year].every((v) => v === undefined || v === null || v === '');
};

/**
 * Checks if a message is a due date error message (starts with 'the due date').
 * @param {string} msg - The error message
 * @returns {boolean} True if the message is a due date error
 */
const isDueDateErrorMessage = (msg: string): boolean =>
  msg.toLowerCase().startsWith('the due date');

/**
 * Checks if there is any error related to due date fields (dueDate, dueDate-day, dueDate-month, dueDate-year),
 * but only if at least one due date field is filled in.
 * @param {any} messages - Flash messages object
 * @param {any} formData - The form data object
 * @returns {boolean} True if any due date field has an error and at least one field is filled
 */
export const hasDueDateError = (messages: any, formData?: any): boolean => {
  if (!messages || !messages.error) return false;
  if (!anyDueDateFieldFilled(formData)) return false;
  return (
    hasError(messages, 'dueDate') ||
    hasError(messages, 'dueDate-day') ||
    hasError(messages, 'dueDate-month') ||
    hasError(messages, 'dueDate-year') ||
    messages.error.some(isDueDateErrorMessage)
  );
};

/**
 * Gets the first error message related to due date fields (dueDate, dueDate-day, dueDate-month, dueDate-year),
 * but only if at least one due date field is filled in.
 * @param {any} messages - Flash messages object
 * @param {any} formData - The form data object
 * @returns {string} Error message for the due date fields or empty string
 */
export const getDueDateErrorMessage = (messages: any, formData?: any): string => {
  if (!messages || !messages.error) return '';
  if (!anyDueDateFieldFilled(formData)) return '';
  const fields = ['dueDate', 'dueDate-day', 'dueDate-month', 'dueDate-year'];
  for (const field of fields) {
    if (hasError(messages, field)) return getErrorMessage(messages, field);
  }
  const generic = messages.error.find(isDueDateErrorMessage);
  return generic || '';
};

/**
 * Returns only the visible error messages, filtering out due date errors if all due date fields are empty.
 * Used for notification banners and global error display.
 * @param {string[]} errors - The error messages array
 * @param {any} session - The session object (to access formData)
 * @returns {string[]} The filtered error messages
 */
export const getVisibleErrors = (errors: string[], session: any): string[] => {
  let formData: any = undefined;
  if (session && session.formData) formData = session.formData;
  return errors.filter(
    (msg: string) => !(isDueDateErrorMessage(msg) && allDueDateFieldsEmpty(formData)),
  );
};
