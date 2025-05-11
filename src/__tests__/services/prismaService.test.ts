import { PrismaServiceInstance } from '../../services/PrismaService.ts';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: mockConnect,
      $disconnect: mockDisconnect,
    })),
    CaseStatus: {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
    },
    Prisma: {
      prismaVersion: { client: '1.0.0' },
    },
  };
});

describe('PrismaService', () => {
  let mockPrismaClientConstructor: jest.Mock;
  const service: typeof PrismaServiceInstance = PrismaServiceInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClientConstructor = PrismaClient as unknown as jest.Mock;
  });

  describe('getClient', () => {
    it('should return the PrismaClient instance', () => {
      const client = service.getClient();

      expect(client).toBeDefined();
      expect(client.$connect).toBeDefined();
      expect(client.$disconnect).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should call $connect on the PrismaClient instance', async () => {
      const client = service.getClient();

      await service.connect();

      expect(client.$connect).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors when connect fails', async () => {
      const client = service.getClient();
      const error = new Error('Connection failed');

      (client.$connect as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should call $disconnect on the PrismaClient instance', async () => {
      const client = service.getClient();

      await service.disconnect();

      expect(client.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors when disconnect fails', async () => {
      const client = service.getClient();
      const error = new Error('Disconnection failed');

      (client.$disconnect as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.disconnect()).rejects.toThrow('Disconnection failed');
    });
  });

  describe('Exports', () => {
    it('should export necessary objects and types', async () => {
      const exports = await import('../../services/PrismaService.ts');

      expect(exports.prisma).toBeDefined();
      expect(exports.PrismaServiceInstance).toBeDefined();
      expect(exports.CaseStatus).toBeDefined();
      expect(exports.Prisma).toBeDefined();
    });
  });
});
