import { Module } from '@nestjs/common';
import { NeteasePlaylistModule } from '../playlist/playlist.module';
import { NeteaseParseController } from './parse.controller';
import { NeteaseParseService } from './parse.service';

@Module({
  imports: [NeteasePlaylistModule],
  controllers: [NeteaseParseController],
  providers: [NeteaseParseService],
  exports: [NeteaseParseService],
})
export class NeteaseParseModule {}
