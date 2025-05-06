import { Case, Prisma, PrismaClient, CaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

export { CaseStatus, Case, prisma, Prisma };
