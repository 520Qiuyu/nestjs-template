import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CardSecretService } from './card-secret.service';

@Controller('qishui/card-secret')
export class CardSecretController {
  constructor(private readonly cardSecretService: CardSecretService) {}

  // 获取卡密列表
  @Get()
  list() {
    return this.cardSecretService.list();
  }

  // 获取卡密详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.cardSecretService.getById(id);
  }

  // 创建卡密
  @Post()
  create(@Body() body: unknown) {
    return this.cardSecretService.create(body);
  }

  // 更新卡密
  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.cardSecretService.update(id, body);
  }

  // 删除卡密
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardSecretService.remove(id);
  }
}
