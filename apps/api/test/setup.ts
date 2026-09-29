import { afterAll, beforeEach } from 'vitest';
import { prisma, resetDb } from './helpers/db';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
