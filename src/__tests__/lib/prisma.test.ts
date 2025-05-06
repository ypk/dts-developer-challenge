 
/* eslint-disable @typescript-eslint/unbound-method */
 

jest.mock('@prisma/client', () => {
  // Create mock functions with explicit type casting
  const mockConnect = jest.fn().mockResolvedValue(undefined as void);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined as void);
  const mockCount = jest.fn().mockResolvedValue(0 as number);

  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    case: {
      count: mockCount,
    },
  }));

  const mockCaseStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  };

  return {
    PrismaClient: mockPrismaClient,
    CaseStatus: mockCaseStatus,
  };
});

describe('Prisma Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should export prisma client instance', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const { prisma: exportedPrisma } = await import('../../lib/prisma.ts');

    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(exportedPrisma).toBeDefined();
    expect(typeof exportedPrisma.$connect).toBe('function');
    expect(typeof exportedPrisma.$disconnect).toBe('function');
    expect(typeof exportedPrisma.case.count).toBe('function');
  });

  it('should export CaseStatus enum', async () => {
    const { CaseStatus: exportedCaseStatus } = await import('../../lib/prisma.ts');

    expect(exportedCaseStatus).toBeDefined();
    expect(exportedCaseStatus.PENDING).toBe('PENDING');
    expect(exportedCaseStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(exportedCaseStatus.COMPLETED).toBe('COMPLETED');
  });

  it('should be able to connect to the database', async () => {
    const { prisma } = await import('../../lib/prisma.ts');

    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should be able to disconnect from the database', async () => {
    const { prisma } = await import('../../lib/prisma.ts');

    await expect(prisma.$disconnect()).resolves.not.toThrow();
  });

  it('should be able to count cases', async () => {
    const { prisma } = await import('../../lib/prisma.ts');

    const count = await prisma.case.count();
    expect(count).toBe(0);
    expect(prisma.case.count).toHaveBeenCalledTimes(1);
  });
});
