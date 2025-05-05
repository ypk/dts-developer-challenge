/* eslint-disable @typescript-eslint/unbound-method */
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    case: {
      count: jest.fn().mockResolvedValue(0),
    },
  }));

  return {
    PrismaClient: mockPrismaClient,
  };
});

describe('Prisma Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should export a PrismaClient instance', async () => {
    const prisma = (await import('../../lib/prisma.js')).default;

    expect(PrismaClient).toHaveBeenCalledTimes(1);

    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
    expect(typeof prisma.case.count).toBe('function');
  });

  it('should be able to connect to the database', async () => {
    const prisma = (await import('../../lib/prisma.js')).default;

    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should be able to disconnect from the database', async () => {
    const prisma = (await import('../../lib/prisma.js')).default;

    await expect(prisma.$disconnect()).resolves.not.toThrow();
  });

  it('should be able to count cases', async () => {
    const prisma = (await import('../../lib/prisma.js')).default;

    const count = await prisma.case.count();
    expect(count).toBe(0);
    expect(prisma.case.count).toHaveBeenCalledTimes(1);
  });
});
