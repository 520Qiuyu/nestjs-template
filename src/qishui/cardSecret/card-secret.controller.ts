import { Public } from '@/auth/decorator/auth.decorator';
import { CurrentUser } from '@/auth/decorator/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CardSecretService } from './card-secret.service';
import {
  CreateCardSecretDto,
  ListCardSecretQueryDto,
  UpdateCardSecretDto,
  UpdateCardSecretStatusDto,
} from './dto/card-secret.dto';

@Controller('qishui/card-secret')
export class CardSecretController {
  constructor(private readonly cardSecretService: CardSecretService) {}

  // 获取卡密列表
  @Get()
  list(
    @Query() query: ListCardSecretQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.cardSecretService.list(query, user);
  }

  // 获取卡密列表 创建者下拉
  @Get('create-user-options')
  getCreateUserOptions(@CurrentUser() user: User) {
    return this.cardSecretService.getCreateUserOptions(user);
  }

  // 获取卡密详情（根据卡密）——需放在 :id 之前，避免被当成 id
  @Public()
  @Get('secret/:secret')
  getBySecret(@Param('secret') secret: string) {
    return this.cardSecretService.getBySecret(secret);
  }

  // 获取卡密详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.cardSecretService.getById(id);
  }

  // 创建卡密
  @Post()
  create(@Body() body: CreateCardSecretDto, @CurrentUser() user: User) {
    return this.cardSecretService.create(body, user);
  }

  // 更新卡密状态 —— 需放在 :id 通用更新之前
  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateCardSecretStatusDto,
  ) {
    return this.cardSecretService.updateStatus(id, body);
  }

  // 更新卡密
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateCardSecretDto) {
    return this.cardSecretService.update(id, body);
  }

  // 删除卡密
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardSecretService.remove(id);
  }
}
