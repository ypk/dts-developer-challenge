/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        case: {
          count: jest.fn(),
        },
        $disconnect: jest.fn(),
      };
    }),
  };
});

import prisma from '../lib/prisma.js';

describe('Prisma Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a PrismaClient instance with case model', () => {
    expect(PrismaClient).toHaveBeenCalledTimes(1);

    expect(prisma).toBeDefined();
    expect(prisma.case).toBeDefined();
    expect(prisma.case.count).toBeDefined();
    expect(typeof prisma.case.count).toBe('function');
  });
});
