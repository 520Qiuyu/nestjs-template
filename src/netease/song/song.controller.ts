import { Public } from '@/auth/decorator/auth.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  GetNeteaseSongDetailQueryDto,
  GetNeteaseSongDownloadQueryDto,
  GetNeteaseSongQualityQueryDto,
} from './dto/song.dto';
import { NeteaseSongService } from './song.service';

@Controller('netease/song')
@Public()
export class NeteaseSongController {
  constructor(private readonly songService: NeteaseSongService) {}

  // 获取歌曲详情
  @Get('detail')
  getSongDetail(@Query() query: GetNeteaseSongDetailQueryDto) {
    return this.songService.getSongDetail(query);
  }

  // 获取歌曲音质详情
  @Get('quality')
  getSongQuality(@Query() query: GetNeteaseSongQualityQueryDto) {
    return this.songService.getSongQuality(query);
  }

  // 获取歌曲下载地址
  @Get('download')
  getSongDownload(@Query() query: GetNeteaseSongDownloadQueryDto) {
    return this.songService.getSongDownload(query);
  }
}
