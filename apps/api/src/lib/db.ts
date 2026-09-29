import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export const createPrismaClient = (connectionString: string) =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

export type { PrismaClient };
