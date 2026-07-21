import { Public } from '@/auth/decorator/auth.decorator';
import {
  GetSongInfoQueryDto,
  ParseShareLinkQueryDto,
  type PlaylistParseShareLinkQueryDto,
} from '@/qishui/dto/qishui-dto';
import { Controller, Get, Query } from '@nestjs/common';
import { QishuiService } from './qishui.service';

@Controller('qishui')
@Public()
export class QishuiController {
  constructor(private readonly qishuiService: QishuiService) {}

  // 歌曲分享链接解析
  @Get('parse-song-share-link')
  async parseSongShareLink(@Query() query: ParseShareLinkQueryDto) {
    return this.qishuiService.parseSongShareLink(query);
  }

  // 歌单分享链接解析
  @Get('parse-playlist-share-link')
  async parsePlaylistShareLink(@Query() query: PlaylistParseShareLinkQueryDto) {
    return this.qishuiService.parsePlaylistShareLink(query);
  }

  // 根据歌曲id获取歌曲信息
  @Get('get-song-info')
  async getSongInfo(@Query() query: GetSongInfoQueryDto) {
    return this.qishuiService.getSongInfo(query);
  }
}
