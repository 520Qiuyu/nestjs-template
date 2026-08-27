import { Module } from '@nestjs/common';
import { NeteasePlaylistController } from './playlist.controller';
import { NeteasePlaylistService } from './playlist.service';

@Module({
  controllers: [NeteasePlaylistController],
  providers: [NeteasePlaylistService],
  exports: [NeteasePlaylistService],
})
export class NeteasePlaylistModule {}
