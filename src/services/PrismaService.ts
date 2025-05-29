/**
 * Prisma database service module
 * @module PrismaService
 * @description Provides a singleton PrismaClient instance and DB-related types using a class-based approach
 */
import pkg from '@prisma/client';
import { Prisma, type Case } from '@prisma/client';

const { PrismaClient } = pkg;

/**
 * Class that manages the Prisma database connection
 * @class PrismaService
 * @description Implements the singleton pattern for PrismaClient
 */
export class PrismaService {
  /**
   * The singleton instance of the PrismaService
   * @private
   * @static
   * @type {PrismaService}
   */
  private static instance: PrismaService;

  /**
   * The PrismaClient instance used for database operations
   * @private
   * @type {PrismaClient}
   */
  private prismaClient: InstanceType<typeof PrismaClient>;

  /**
   * Private constructor to prevent direct instantiation
   * @private
   */
  private constructor() {
    this.prismaClient = new PrismaClient();
  }

  /**
   * Gets the singleton instance of PrismaService
   * @static
   * @returns {PrismaService} The singleton instance
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Gets the PrismaClient instance
   * @returns {PrismaClient} The PrismaClient instance
   */
  public getClient(): InstanceType<typeof PrismaClient> {
    return this.prismaClient;
  }

  /**
   * Disconnects the PrismaClient
   * @async
   * @returns {Promise<void>} Promise that resolves when disconnection is complete
   */
  public async disconnect(): Promise<void> {
    await this.prismaClient.$disconnect();
  }

  /**
   * Connects the PrismaClient
   * @async
   * @returns {Promise<void>} Promise that resolves when connection is complete
   */
  public async connect(): Promise<void> {
    await this.prismaClient.$connect();
  }
}

/**
 * Singleton instance of PrismaService
 * @const {PrismaService}
 */
const PrismaServiceInstance = PrismaService.getInstance();

/**
 * Singleton PrismaClient instance for database operations
 * @const {PrismaClient}
 */
export const prisma = PrismaServiceInstance.getClient();

/**
 * Re-export CaseStatus enum with both runtime values and types
 */
export { CaseStatus } from '@prisma/client';

/**
 * Re-export required types and service instance
 * @exports Case - Type definition for the Case model
 * @exports Prisma - Namespace containing Prisma utilities and types
 * @exports PrismaServiceInstance - The PrismaService singleton instance
 */
export { Case, Prisma, PrismaServiceInstance };
