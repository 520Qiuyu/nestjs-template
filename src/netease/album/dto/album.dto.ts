import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 获取专辑详情查询参数 */
export const GetNeteaseAlbumDetailQuerySchema = z.object({
  id: z.string().min(1, '专辑 id 不能为空'),
  cardSecret: z.string().min(1, '卡密不能为空'),
});
/** 获取专辑详情查询参数类型 */
export class GetNeteaseAlbumDetailQueryDto extends createZodDto(
  GetNeteaseAlbumDetailQuerySchema,
) {}
