import { Public } from '@/auth/decorator/auth.decorator';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ParseNeteaseAlbumQueryDto,
  ParseNeteaseArtistQueryDto,
  ParseNeteasePlaylistQueryDto,
  ParseNeteaseSongQueryDto,
} from './dto/parse.dto';
import { NeteaseParseService } from './parse.service';

@Controller('netease/parse')
@Public()
export class NeteaseParseController {
  constructor(private readonly parseService: NeteaseParseService) {}

  // 单曲解析
  @Get('song')
  parseSong(
    @Query() query: ParseNeteaseSongQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.parseService.parseSong(query, meta);
  }

  // 歌单解析
  @Get('playlist')
  parsePlaylist(
    @Query() query: ParseNeteasePlaylistQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.parseService.parsePlaylist(query, meta);
  }

  // 专辑解析
  @Get('album')
  parseAlbum(
    @Query() query: ParseNeteaseAlbumQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.parseService.parseAlbum(query, meta);
  }

  // 歌手解析
  @Get('artist')
  parseArtist(
    @Query() query: ParseNeteaseArtistQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.parseService.parseArtist(query, meta);
  }
}
