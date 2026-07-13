import { Module } from '@nestjs/common';
import { AuthManagementModule } from './authManagement/auth-management.module';
import { CardSecretModule } from './cardSecret/card-secret.module';
import { LogsModule } from './logs/logs.module';
import { QishuiController } from './qishui.controller';
import { QishuiService } from './qishui.service';

@Module({
  imports: [AuthManagementModule, CardSecretModule, LogsModule],
  controllers: [QishuiController],
  providers: [QishuiService],
})
export class QishuiModule {}
