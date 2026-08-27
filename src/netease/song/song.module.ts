import { Module } from '@nestjs/common';
import { NeteaseSongController } from './song.controller';
import { NeteaseSongService } from './song.service';

@Module({
  controllers: [NeteaseSongController],
  providers: [NeteaseSongService],
  exports: [NeteaseSongService],
})
export class NeteaseSongModule {}
