import { CurrentUser } from '@/auth/decorator/current-user.decorator';
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { ListParseLogQueryDto } from './dto/logs.dto';
import { LogsService } from './logs.service';

@Controller('qishui/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  // 获取解析日志列表
  @Get()
  list(@Query() query: ListParseLogQueryDto, @CurrentUser() user: User) {
    return this.logsService.list(query, user);
  }

  // 获取解析日志详情
  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.logsService.getById(id, user);
  }

  // 删除解析日志
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.logsService.remove(id, user);
  }
}
