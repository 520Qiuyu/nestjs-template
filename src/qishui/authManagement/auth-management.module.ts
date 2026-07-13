import { Module } from '@nestjs/common';
import { AuthManagementController } from './auth-management.controller';
import { AuthManagementService } from './auth-management.service';

@Module({
  controllers: [AuthManagementController],
  providers: [AuthManagementService],
  exports: [AuthManagementService],
})
export class AuthManagementModule {}
