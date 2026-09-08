import { Public } from '@/auth/decorator/auth.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { NeteaseAlbumService } from './album.service';
import { GetNeteaseAlbumDetailQueryDto } from './dto/album.dto';

@Controller('netease/album')
@Public()
export class NeteaseAlbumController {
  constructor(private readonly albumService: NeteaseAlbumService) {}

  // 获取专辑详情
  @Get('detail')
  getAlbumDetail(@Query() query: GetNeteaseAlbumDetailQueryDto) {
    return this.albumService.getAlbumDetail(query);
  }
}
