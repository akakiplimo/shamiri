import { PrismaClient } from '@prisma/client';

export const db = globalThis.db || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

/* 
  globalThis.prisma: this global variable ensures that the Prisma client instance is
  reused across hot reloads during development. This is useful to avoid creating a new
  Prisma client instance on every request, which can lead to connection issues,
  memory leaks and performance issues.
*/
