import { PrismaService } from '@/prisma.service';
import { Module } from '@nestjs/common';
import { IpBlacklistController } from './ip-blacklist.controller';
import { IpBlacklistService } from './ip-blacklist.service';

@Module({
  controllers: [IpBlacklistController],
  providers: [IpBlacklistService, PrismaService],
  exports: [IpBlacklistService],
})
export class IpBlacklistModule {}
