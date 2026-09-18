import { PrismaService } from '@/prisma.service';
import { NeteaseUserModule } from '@/netease/user/user.module';
import { Module } from '@nestjs/common';
import { AuthManagementController } from './auth-management.controller';
import { AuthManagementService } from './auth-management.service';

@Module({
  imports: [NeteaseUserModule],
  controllers: [AuthManagementController],
  providers: [AuthManagementService, PrismaService],
  exports: [AuthManagementService],
})
export class AuthManagementModule {}
