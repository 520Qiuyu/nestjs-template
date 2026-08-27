import { Module } from '@nestjs/common';
import { NeteaseAlbumController } from './album.controller';
import { NeteaseAlbumService } from './album.service';

@Module({
  controllers: [NeteaseAlbumController],
  providers: [NeteaseAlbumService],
  exports: [NeteaseAlbumService],
})
export class NeteaseAlbumModule {}
