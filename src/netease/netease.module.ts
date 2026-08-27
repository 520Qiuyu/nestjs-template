import { Module } from '@nestjs/common';
import { NeteaseAlbumModule } from './album/album.module';
import { NeteaseArtistModule } from './artist/artist.module';
import { NeteaseParseModule } from './parse/parse.module';
import { NeteasePlaylistModule } from './playlist/playlist.module';
import { NeteaseSearchModule } from './search/search.module';
import { NeteaseSongModule } from './song/song.module';
import { NeteaseUserModule } from './user/user.module';

@Module({
  imports: [
    NeteaseParseModule,
    NeteaseSongModule,
    NeteaseArtistModule,
    NeteaseUserModule,
    NeteaseAlbumModule,
    NeteasePlaylistModule,
    NeteaseSearchModule,
  ],
})
export class NeteaseModule {}
