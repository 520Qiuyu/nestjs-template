import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Config } from '@/types/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.get<string>(Config.DATABASE_HOST)!,
      port: configService.get<number>(Config.DATABASE_PORT)!,
      user: configService.get<string>(Config.DATABASE_USER)!,
      password: configService.get<string>(Config.DATABASE_PASSWORD)!,
      database: configService.get<string>(Config.DATABASE_NAME)!,
      connectionLimit: 5,
    });
    super({ adapter, log: ['query', 'info', 'warn', 'error'] });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
