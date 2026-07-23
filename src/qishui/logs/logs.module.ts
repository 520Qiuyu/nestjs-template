import { PrismaService } from '@/prisma.service';
import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  imports: [UserModule],
  controllers: [LogsController],
  providers: [LogsService, PrismaService],
  exports: [LogsService],
})
export class LogsModule {}
