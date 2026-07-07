import { PrismaService } from '@/prisma.service';
import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

@Module({
  imports: [],
  controllers: [PermissionController],
  providers: [PermissionService, PrismaService],
  exports: [PermissionService],
})
export class PermissionModule {}
