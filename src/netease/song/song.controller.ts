import { Public } from '@/auth/decorator/auth.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { GetNeteaseSongDetailQueryDto } from './dto/song.dto';
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
}
