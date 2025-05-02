import request from 'supertest';

const mockPrismaCase = {
  count: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    case: mockPrismaCase,
  },
}));

import app from '../server.js';

describe('GET /', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the count of cases successfully', async () => {
    // Set up the mock to return 5
    mockPrismaCase.count.mockResolvedValue(5);

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      count: 5,
      message: 'Found 5 cases in the database',
    });
    expect(mockPrismaCase.count).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when counting cases', async () => {
    // Set up the mock to throw an error
    mockPrismaCase.count.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Error counting cases in the database',
      error: 'Database error',
    });
    expect(mockPrismaCase.count).toHaveBeenCalledTimes(1);
  });

  it('should return a 500 error with an unknown error', async () => {
    mockPrismaCase.count.mockRejectedValue('Unknown error');

    const response = await request(app).get('/');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Error counting cases in the database',
      error: 'Unknown error',
    });
    expect(mockPrismaCase.count).toHaveBeenCalledTimes(1);
  });
});
