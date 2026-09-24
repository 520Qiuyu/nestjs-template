import { CurrentUser } from '@/auth/decorator/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  CreateIpBlacklistDto,
  LatestIpBlacklistQueryDto,
  ListIpBlacklistQueryDto,
  UpdateIpBlacklistDto,
  UpdateIpBlacklistEnabledDto,
} from './dto/ip-blacklist.dto';
import { IpBlacklistService } from './ip-blacklist.service';

@Controller('ip-blacklist')
export class IpBlacklistController {
  constructor(private readonly ipBlacklistService: IpBlacklistService) {}

  // 获取黑名单拦截开关
  @Get('enabled')
  getEnabled() {
    return this.ipBlacklistService.getEnabled();
  }

  // 更新黑名单拦截开关
  @Put('enabled')
  setEnabled(@Body() body: UpdateIpBlacklistEnabledDto) {
    return this.ipBlacklistService.setEnabled(body);
  }

  // 获取黑名单列表
  @Get()
  list(@Query() query: ListIpBlacklistQueryDto) {
    return this.ipBlacklistService.list(query);
  }

  // 按 IP 获取最近一条拉黑记录
  @Get('latest')
  getLatest(@Query() query: LatestIpBlacklistQueryDto) {
    return this.ipBlacklistService.getLatestByIp(query.ip);
  }

  // 获取黑名单详情
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ipBlacklistService.getById(id);
  }

  // 添加黑名单
  @Post()
  create(@Body() body: CreateIpBlacklistDto, @CurrentUser() user: User) {
    return this.ipBlacklistService.create(body, user);
  }

  // 更新单条黑名单启用状态
  @Put(':id/enabled')
  setRecordEnabled(
    @Param('id') id: string,
    @Body() body: UpdateIpBlacklistEnabledDto,
  ) {
    return this.ipBlacklistService.setRecordEnabled(id, body);
  }

  // 解除拉黑
  @Post(':id/unblock')
  unblock(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ipBlacklistService.unblock(id, user);
  }

  // 更新黑名单
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateIpBlacklistDto) {
    return this.ipBlacklistService.update(id, body);
  }
}
