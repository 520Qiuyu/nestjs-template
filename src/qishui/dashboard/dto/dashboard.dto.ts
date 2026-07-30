import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 看板时间范围 */
export const DashboardRangeSchema = z.enum(['today', '7d', '30d']);

/** 看板总览查询参数 */
export const DashboardOverviewQuerySchema = z.object({
  /** 时间范围：今日 / 近7天 / 近30天 */
  range: DashboardRangeSchema.default('7d'),
  /** 创建者 ID；仅管理员可用，代理会被忽略并强制为自己 */
  creatorId: z.string().optional(),
});

/** 看板总览查询参数类型 */
export class DashboardOverviewQueryDto extends createZodDto(
  DashboardOverviewQuerySchema,
) {}
