import { CardSecretModule } from '@/qishui/cardSecret/card-secret.module';
import { LogsModule } from '@/qishui/logs/logs.module';
import { Module } from '@nestjs/common';
import { NeteaseSongController } from './song.controller';
import { NeteaseSongService } from './song.service';

@Module({
  imports: [CardSecretModule, LogsModule],
  controllers: [NeteaseSongController],
  providers: [NeteaseSongService],
  exports: [NeteaseSongService],
})
export class NeteaseSongModule {}
