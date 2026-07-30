import { CurrentUser } from '@/auth/decorator/current-user.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewQueryDto } from './dto/dashboard.dto';

@Controller('qishui/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  //看板总览（指标 / 趋势 / 排行 / 分布）
  @Get('overview')
  getOverview(
    @Query() query: DashboardOverviewQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.dashboardService.getOverview(query, user);
  }
}
