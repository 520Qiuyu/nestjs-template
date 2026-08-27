import { Module } from '@nestjs/common';
import { NeteaseArtistController } from './artist.controller';
import { NeteaseArtistService } from './artist.service';

@Module({
  controllers: [NeteaseArtistController],
  providers: [NeteaseArtistService],
  exports: [NeteaseArtistService],
})
export class NeteaseArtistModule {}
