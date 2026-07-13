import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 分享链接解析查询参数 */
export const ParseShareLinkQuerySchema = z.object({
  shareLink: z.string().min(1, '分享链接不能为空'),
});
/** 分享链接解析查询参数类型 */
export class ParseShareLinkQueryDto extends createZodDto(
  ParseShareLinkQuerySchema,
) {}

/** 根据歌曲 id 查询参数 */
export const GetSongInfoQuerySchema = z.object({
  songId: z.string().min(1, '歌曲 id 不能为空'),
});
/** 根据歌曲 id 查询参数类型 */
export class GetSongInfoQueryDto extends createZodDto(GetSongInfoQuerySchema) {}

/** 根据歌单 id 查询参数 */
export const GetPlaylistInfoQuerySchema = z.object({
  playlistId: z.string().min(1, '歌单 id 不能为空'),
});
/** 根据歌单 id 查询参数类型 */
export class GetPlaylistInfoQueryDto extends createZodDto(
  GetPlaylistInfoQuerySchema,
) {}

/** 获取歌曲播放链接查询参数 */
export const GetSongPlayUrlQuerySchema = z.object({
  songId: z.string().min(1, '歌曲 id 不能为空'),
});
/** 获取歌曲播放链接查询参数类型 */
export class GetSongPlayUrlQueryDto extends createZodDto(
  GetSongPlayUrlQuerySchema,
) {}
