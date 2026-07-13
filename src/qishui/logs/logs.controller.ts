import { Controller, Delete, Get, Param } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('qishui/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  // 获取日志列表
  @Get()
  list() {
    return this.logsService.list();
  }

  // 获取日志详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.logsService.getById(id);
  }

  // 删除日志
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logsService.remove(id);
  }
}
