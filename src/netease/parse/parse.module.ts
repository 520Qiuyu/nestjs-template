import { Module } from '@nestjs/common';
import { NeteasePlaylistModule } from '../playlist/playlist.module';
import { NeteaseParseController } from './parse.controller';
import { NeteaseParseService } from './parse.service';
import { NeteaseSongModule } from '../song/song.module';

@Module({
  imports: [NeteasePlaylistModule, NeteaseSongModule],
  controllers: [NeteaseParseController],
  providers: [NeteaseParseService],
  exports: [NeteaseParseService],
})
export class NeteaseParseModule {}
