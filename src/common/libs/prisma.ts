import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { Config } from 'src/types/config';
import loadConfigs from './loadConfigs';

const config = loadConfigs();

const adapter = new PrismaMariaDb({
  host: config[Config.DATABASE_HOST],
  port: Number(config[Config.DATABASE_PORT] || 3306),
  user: config[Config.DATABASE_USER],
  password: config[Config.DATABASE_PASSWORD],
  database: config[Config.DATABASE_NAME],
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export { prisma, adapter };
