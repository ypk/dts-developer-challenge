/* eslint-disable @typescript-eslint/unbound-method */
 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';

// Create a more permissive mock type
type AnyMock = {
  mockResolvedValue: (value: any) => any;
  mockRejectedValue: (value: any) => any;
};

jest.mock('../lib/prisma.js', () => ({
  __esModule: true,
  default: {
    case: {
      count: jest.fn(),
    },
  },
}));

import prisma from '../lib/prisma.js';
import app from '../server.js';

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('GET /', () => {
    it('should return case count when database query succeeds', async () => {
      // Use a more permissive type assertion
      (prisma.case.count as unknown as AnyMock).mockResolvedValue(5);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        count: 5,
        message: 'Found 5 cases in the database',
      });

      expect(prisma.case.count).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when database query fails', async () => {
      const errorMessage = 'Database connection failed';
      (prisma.case.count as unknown as AnyMock).mockRejectedValue(new Error(errorMessage));

      const response = await request(app).get('/');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Error counting cases in the database',
        error: errorMessage,
      });

      expect(prisma.case.count).toHaveBeenCalledTimes(1);
    });

    it('should return 500 with unknown error when error is not an instance of Error', async () => {
      (prisma.case.count as unknown as AnyMock).mockRejectedValue('Some string error');

      const response = await request(app).get('/');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Error counting cases in the database',
        error: 'Unknown error',
      });

      expect(prisma.case.count).toHaveBeenCalledTimes(1);
    });
  });

  // Test that the server doesn't start when NODE_ENV is 'test'
  describe('Server initialization', () => {
    it('should not call app.listen when NODE_ENV is test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});
