import { PrismaClient } from '@prisma/client';

const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockCase = {};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
  CaseStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  },
  Prisma: {
    CaseCreateInput: {} as any,
    CaseUpdateInput: {} as any,
  },
  Case: mockCase,
}));

import {
  PrismaService,
  PrismaServiceInstance,
  prisma,
  CaseStatus,
  Case,
  Prisma,
} from '../../services/PrismaService.js';

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should create a single instance', () => {
      const instance1 = PrismaService.getInstance();
      const instance2 = PrismaService.getInstance();

      expect(instance1).toBeInstanceOf(PrismaService);
      expect(instance2).toBeInstanceOf(PrismaService);
      expect(instance1).toBe(instance2);
    });

    it('should not allow creating multiple instances through getInstance', () => {
      const instances = [];
      for (let i = 0; i < 5; i++) {
        instances.push(PrismaService.getInstance());
      }

      const firstInstance = instances[0];
      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
        expect(instance).toBeInstanceOf(PrismaService);
      });
    });
  });

  describe('getClient', () => {
    it('should return the PrismaClient instance', () => {
      const service = PrismaService.getInstance();

      const client = service.getClient();

      expect(client).toBe(mockPrismaClient);
    });

    it('should return the same client instance on multiple calls', () => {
      const service = PrismaService.getInstance();

      const client1 = service.getClient();
      const client2 = service.getClient();

      expect(client1).toBe(client2);
      expect(client1).toBe(mockPrismaClient);
    });

    it('should return client from different service instances', () => {
      const service1 = PrismaService.getInstance();
      const service2 = PrismaService.getInstance();

      const client1 = service1.getClient();
      const client2 = service2.getClient();

      expect(client1).toBe(client2);
    });
  });

  describe('connect', () => {
    it('should call $connect on PrismaClient', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await service.connect();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$connect).toHaveBeenCalledWith();
    });

    it('should handle successful connection', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await expect(service.connect()).resolves.toBeUndefined();
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should propagate connection errors', async () => {
      const service = PrismaService.getInstance();
      const connectionError = new Error('Database connection failed');
      mockPrismaClient.$connect.mockRejectedValue(connectionError);

      await expect(service.connect()).rejects.toThrow('Database connection failed');
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple connect calls', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await service.connect();
      await service.connect();
      await service.connect();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
    });

    it('should handle connection timeout errors', async () => {
      const service = PrismaService.getInstance();
      const timeoutError = new Error('Connection timeout');
      mockPrismaClient.$connect.mockRejectedValue(timeoutError);

      await expect(service.connect()).rejects.toThrow('Connection timeout');
    });

    it('should handle non-Error rejections', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockRejectedValue('String error');

      await expect(service.connect()).rejects.toBe('String error');
    });
  });

  describe('disconnect', () => {
    it('should call $disconnect on PrismaClient', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledWith();
    });

    it('should handle successful disconnection', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await expect(service.disconnect()).resolves.toBeUndefined();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should propagate disconnection errors', async () => {
      const service = PrismaService.getInstance();
      const disconnectionError = new Error('Database disconnection failed');
      mockPrismaClient.$disconnect.mockRejectedValue(disconnectionError);

      await expect(service.disconnect()).rejects.toThrow('Database disconnection failed');
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple disconnect calls', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.disconnect();
      await service.disconnect();
      await service.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(3);
    });

    it('should handle disconnection when not connected', async () => {
      const service = PrismaService.getInstance();
      const notConnectedError = new Error('Not connected');
      mockPrismaClient.$disconnect.mockRejectedValue(notConnectedError);

      await expect(service.disconnect()).rejects.toThrow('Not connected');
    });

    it('should handle non-Error rejections', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$disconnect.mockRejectedValue({ code: 'DISCONNECT_FAILED' });

      await expect(service.disconnect()).rejects.toEqual({ code: 'DISCONNECT_FAILED' });
    });
  });

  describe('Connection lifecycle', () => {
    it('should handle connect followed by disconnect', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.connect();
      await service.disconnect();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple connection cycles', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      for (let i = 0; i < 3; i++) {
        await service.connect();
        await service.disconnect();
      }

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent connect/disconnect operations', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      const operations = [
        service.connect(),
        service.disconnect(),
        service.connect(),
        service.disconnect(),
      ];

      await Promise.all(operations);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle null/undefined errors from PrismaClient', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockRejectedValue(null);

      await expect(service.connect()).rejects.toBeNull();
    });

    it('should handle non-Error objects thrown from PrismaClient', async () => {
      const service = PrismaService.getInstance();
      const nonErrorObject = { code: 'CONN_FAILED', message: 'Connection failed' };
      mockPrismaClient.$disconnect.mockRejectedValue(nonErrorObject);

      await expect(service.disconnect()).rejects.toEqual(nonErrorObject);
    });

    it('should handle string errors from PrismaClient', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockRejectedValue('Connection string error');

      await expect(service.connect()).rejects.toBe('Connection string error');
    });
  });

  describe('Exported instances', () => {
    it('should export PrismaServiceInstance as singleton', () => {
      const exportedInstance = PrismaServiceInstance;
      const directInstance = PrismaService.getInstance();

      expect(exportedInstance).toBeInstanceOf(PrismaService);
      expect(exportedInstance).toStrictEqual(directInstance);
    });

    it('should export prisma client from singleton instance', () => {
      const exportedPrisma = prisma;
      const serviceInstance = PrismaService.getInstance();
      const clientFromService = serviceInstance.getClient();

      expect(exportedPrisma).toBe(clientFromService);
      expect(exportedPrisma).toBe(mockPrismaClient);
    });

    it('should maintain consistency between exports', () => {
      const exportedInstance = PrismaServiceInstance;
      const exportedPrisma = prisma;
      const directInstance = PrismaService.getInstance();
      const directClient = directInstance.getClient();

      expect(exportedInstance).toStrictEqual(directInstance);
      expect(exportedPrisma).toBe(directClient);
    });

    it('should provide same client through different access methods', () => {
      const viaExport = prisma;
      const viaInstance = PrismaServiceInstance.getClient();
      const viaGetInstance = PrismaService.getInstance().getClient();

      expect(viaExport).toBe(viaInstance);
      expect(viaInstance).toBe(viaGetInstance);
      expect(viaExport).toBe(mockPrismaClient);
    });
  });

  describe('Type exports', () => {
    it('should export CaseStatus enum', () => {
      expect(CaseStatus).toBeDefined();
      expect(typeof CaseStatus).toBe('object');
      expect(CaseStatus.PENDING).toBe('PENDING');
      expect(CaseStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(CaseStatus.COMPLETED).toBe('COMPLETED');
    });

    it('should export Prisma namespace', () => {
      expect(Prisma).toBeDefined();
      expect(typeof Prisma).toBe('object');
    });

    it('should have consistent type exports', () => {
      expect(CaseStatus).toEqual({
        PENDING: 'PENDING',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
      });

      expect(Prisma).toEqual({
        CaseCreateInput: {},
        CaseUpdateInput: {},
      });
    });
  });

  describe('Module initialization and consistency', () => {
    it('should initialize singleton instance on module load', () => {
      expect(PrismaServiceInstance).toBeInstanceOf(PrismaService);
      expect(PrismaServiceInstance.getClient()).toBe(mockPrismaClient);
    });

    it('should initialize prisma client on module load', () => {
      expect(prisma).toBe(mockPrismaClient);
    });

    it('should maintain singleton pattern across different access methods', () => {
      const throughGetInstance = PrismaService.getInstance();
      const throughExport = PrismaServiceInstance;

      expect(throughGetInstance.getClient()).toBe(throughExport.getClient());
      expect(throughGetInstance.getClient()).toBe(prisma);
    });
  });

  describe('Performance and memory', () => {
    it('should reuse the same client across service methods', () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      const client1 = service.getClient();
      const client2 = service.getClient();

      expect(client1).toBe(client2);
      expect(client1).toBe(mockPrismaClient);
    });

    it('should maintain consistent client reference across operations', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      const clientBefore = service.getClient();
      await service.connect();
      const clientAfterConnect = service.getClient();
      await service.disconnect();
      const clientAfterDisconnect = service.getClient();

      expect(clientBefore).toBe(clientAfterConnect);
      expect(clientAfterConnect).toBe(clientAfterDisconnect);
      expect(clientBefore).toBe(mockPrismaClient);
    });
  });

  describe('Static methods', () => {
    it('should provide getInstance as static method', () => {
      expect(typeof PrismaService.getInstance).toBe('function');
      expect(PrismaService.getInstance.length).toBe(0);
    });

    it('should return consistent type from getInstance', () => {
      const instance = PrismaService.getInstance();

      expect(instance).toBeInstanceOf(PrismaService);
      expect(typeof instance.getClient).toBe('function');
      expect(typeof instance.connect).toBe('function');
      expect(typeof instance.disconnect).toBe('function');
    });

    it('should maintain singleton behavior across multiple calls', () => {
      const calls = [];
      for (let i = 0; i < 10; i++) {
        calls.push(PrismaService.getInstance());
      }

      const firstInstance = calls[0];
      calls.forEach((instance) => {
        expect(instance).toBe(firstInstance);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should support typical application lifecycle', async () => {
      const service = PrismaService.getInstance();
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.connect();

      const client = service.getClient();
      expect(client).toBe(mockPrismaClient);

      await service.disconnect();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle service usage across different access patterns', () => {
      const service1 = PrismaService.getInstance();
      const service2 = PrismaService.getInstance();
      const exportedInstance = PrismaServiceInstance;

      const client1 = service1.getClient();
      const client2 = service2.getClient();
      const exportedClient = prisma;
      const instanceClient = exportedInstance.getClient();

      expect(service1).toBe(service2);
      expect(client1).toBe(client2);
      expect(client1).toBe(exportedClient);
      expect(client1).toBe(instanceClient);
    });

    it('should handle concurrent service access', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      const services = [
        PrismaService.getInstance(),
        PrismaService.getInstance(),
        PrismaServiceInstance,
      ];

      const operations = services.map(async (service, index) => {
        await service.connect();
        const client = service.getClient();
        await service.disconnect();
        return { service, client, index };
      });

      const results = await Promise.all(operations);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(3);

      const firstClient = results[0].client;
      results.forEach((result) => {
        expect(result.client).toBe(firstClient);
      });
    });
  });

  describe('Constructor and class structure', () => {
    it('should have private constructor (tested through singleton behavior)', () => {
      const instance1 = PrismaService.getInstance();
      const instance2 = PrismaService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(PrismaService);
    });

    it('should initialize PrismaClient in constructor', () => {
      const service = PrismaService.getInstance();
      const client = service.getClient();

      expect(client).toBe(mockPrismaClient);
      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
    });

    it('should have all required methods', () => {
      const service = PrismaService.getInstance();

      expect(typeof service.getClient).toBe('function');
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');

      expect(service.getClient.length).toBe(0);
      expect(service.connect.length).toBe(0);
      expect(service.disconnect.length).toBe(0);
    });
  });
});
