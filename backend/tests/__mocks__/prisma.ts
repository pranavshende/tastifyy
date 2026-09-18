import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

// Export a deeply mocked Prisma client
export const prismaMock = mockDeep<PrismaClient>() as any;
