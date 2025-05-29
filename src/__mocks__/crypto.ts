/**
 * Mocks the randomBytes function from the crypto module for testing purposes.
 * Returns a mock object with a toString method that always returns 'mocked-random-bytes'.
 * @returns {Object} A mocked object simulating the behavior of randomBytes
 */
export const randomBytes = jest.fn(() => ({
  toString: jest.fn(() => 'mocked-random-bytes'),
}));
