/**
 * CLI 入口：可单独执行
 * @example
 * ```bash
 * npx ts-node -r tsconfig-paths/register scripts/initDatabase.ts
 * ```
 */
import { initDatabase } from '../src/common/scripts/initDatabase';
import { prisma } from '../src/common/libs/prisma';

initDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
