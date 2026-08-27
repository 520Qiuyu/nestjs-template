import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 获取歌单详情查询参数 */
export const GetNeteasePlaylistDetailQuerySchema = z.object({
  id: z.string().min(1, '歌单 id 不能为空'),
});
/** 获取歌单详情查询参数类型 */
export class GetNeteasePlaylistDetailQueryDto extends createZodDto(
  GetNeteasePlaylistDetailQuerySchema,
) {}

/** 获取歌单所有歌曲查询参数 */
export const GetNeteasePlaylistTrackAllQuerySchema = z.object({
  id: z.string().min(1, '歌单 id 不能为空'),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
/** 获取歌单所有歌曲查询参数类型 */
export class GetNeteasePlaylistTrackAllQueryDto extends createZodDto(
  GetNeteasePlaylistTrackAllQuerySchema,
) {}
