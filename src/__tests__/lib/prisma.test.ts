import { CaseStatus, prisma, Prisma } from '../../lib/prisma.ts';

jest.mock('@prisma/client', () => {
  const MockPrismaClient = jest.fn().mockImplementation(() => ({
    case: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }));

  const mockCaseStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  };

  const mockPrisma = {
    CaseCreateInput: {},
    CaseUpdateInput: {},
  };

  return {
    PrismaClient: MockPrismaClient,
    CaseStatus: mockCaseStatus,
    Prisma: mockPrisma,
  };
});

describe('Prisma Library', () => {
  it('should export prisma client instance', () => {
    expect(prisma).toBeDefined();
    expect(prisma.case).toBeDefined();
  });

  it('should export CaseStatus enum', () => {
    expect(CaseStatus).toBeDefined();
    expect(CaseStatus.PENDING).toBe('PENDING');
    expect(CaseStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(CaseStatus.COMPLETED).toBe('COMPLETED');
  });

  it('should export Prisma namespace', () => {
    expect(Prisma).toBeDefined();
    expect(Prisma).toHaveProperty('CaseCreateInput');
    expect(Prisma).toHaveProperty('CaseUpdateInput');
  });

  it('should have case model with CRUD methods', () => {
    expect(prisma.case).toBeDefined();
    expect(typeof prisma.case.findMany).toBe('function');
    expect(typeof prisma.case.findUnique).toBe('function');
    expect(typeof prisma.case.create).toBe('function');
    expect(typeof prisma.case.update).toBe('function');
    expect(typeof prisma.case.delete).toBe('function');
  });
});
