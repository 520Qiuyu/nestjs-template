import { Module } from '@nestjs/common';
import { CardSecretModule } from './cardSecret/card-secret.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogsModule } from './logs/logs.module';
import { QishuiController } from './qishui.controller';
import { QishuiService } from './qishui.service';

@Module({
  imports: [CardSecretModule, LogsModule, DashboardModule],
  controllers: [QishuiController],
  providers: [QishuiService],
})
export class QishuiModule {}
