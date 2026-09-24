import { CardSecretModule } from '@/qishui/cardSecret/card-secret.module';
import { LogsModule } from '@/qishui/logs/logs.module';
import { Module } from '@nestjs/common';
import { NeteaseAlbumModule } from '../album/album.module';
import { NeteasePlaylistModule } from '../playlist/playlist.module';
import { NeteaseSongModule } from '../song/song.module';
import { NeteaseParseController } from './parse.controller';
import { NeteaseParseService } from './parse.service';

@Module({
  imports: [
    NeteasePlaylistModule,
    NeteaseSongModule,
    NeteaseAlbumModule,
    CardSecretModule,
    LogsModule,
  ],
  controllers: [NeteaseParseController],
  providers: [NeteaseParseService],
  exports: [NeteaseParseService],
})
export class NeteaseParseModule {}
