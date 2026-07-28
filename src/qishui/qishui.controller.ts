import { Public } from '@/auth/decorator/auth.decorator';
import { RequestMeta } from '@/common/decorator/request-meta.decorator';
import {
  GetPlaylistDetailQueryDto,
  GetSongInfoQueryDto,
  GetVideoInfoQueryDto,
  ParseShareLinkQueryDto,
  PlaylistParseShareLinkQueryDto,
} from '@/qishui/dto/qishui-dto';
import { Controller, Get, Query } from '@nestjs/common';
import { QishuiService } from './qishui.service';

@Controller('qishui')
@Public()
export class QishuiController {
  constructor(private readonly qishuiService: QishuiService) {}

  // 歌曲分享链接解析
  @Get('parse-song-share-link')
  async parseSongShareLink(
    @Query() query: ParseShareLinkQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.qishuiService.parseSongShareLink(query, meta);
  }

  // 歌单分享链接解析
  @Get('parse-playlist-share-link')
  async parsePlaylistShareLink(
    @Query() query: PlaylistParseShareLinkQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.qishuiService.parsePlaylistShareLink(query, meta);
  }

  // 根据歌曲id获取歌曲信息
  @Get('get-song-info')
  async getSongInfo(
    @Query() query: GetSongInfoQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.qishuiService.getSongInfo(query, meta);
  }

  // 根据视频id获取视频歌曲信息
  @Get('get-video-info')
  async getVideoInfo(
    @Query() query: GetVideoInfoQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.qishuiService.getVideoInfo(query, meta);
  }

  // 根据歌单id获取歌单详情
  @Get('get-playlist-detail')
  async getPlaylistDetail(
    @Query() query: GetPlaylistDetailQueryDto,
    @RequestMeta() meta: RequestMeta,
  ) {
    return this.qishuiService.getPlaylistDetail(query, meta);
  }
}
