import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { Config } from 'src/types/config';
const adapter = new PrismaMariaDb({
  host: process.env[Config.DATABASE_HOST],
  user: process.env[Config.DATABASE_USER],
  password: process.env[Config.DATABASE_PASSWORD],
  database: process.env[Config.DATABASE_NAME],
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });
export { prisma };
