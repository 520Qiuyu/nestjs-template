import { Public } from '@/auth/decorator/auth.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  GetNeteasePlaylistDetailQueryDto,
  GetNeteasePlaylistTrackAllQueryDto,
} from './dto/playlist.dto';
import { NeteasePlaylistService } from './playlist.service';

@Controller('netease/playlist')
@Public()
export class NeteasePlaylistController {
  constructor(private readonly playlistService: NeteasePlaylistService) {}

  // 获取歌单详情
  @Get('detail')
  getPlaylistDetail(@Query() query: GetNeteasePlaylistDetailQueryDto) {
    return this.playlistService.getPlaylistDetail(query);
  }

  // 获取歌单所有歌曲
  @Get('track-all')
  getPlaylistTrackAll(@Query() query: GetNeteasePlaylistTrackAllQueryDto) {
    return this.playlistService.getPlaylistTrackAll(query);
  }
}
