import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 分享链接解析查询参数 */
export const ParseShareLinkQuerySchema = z.object({
  shareLink: z.string().min(1, '分享链接不能为空'),
  cardSecret: z.string(),
});
/** 分享链接解析查询参数类型 */
export class ParseShareLinkQueryDto extends createZodDto(
  ParseShareLinkQuerySchema,
) {}

/** 歌单分享链接解析查询参数 */
export const PlaylistParseShareLinkQuerySchema = z.object({
  shareLink: z.string().min(1, '分享链接不能为空'),
  cardSecret: z.string().optional(),
});
/** 歌单分享链接解析查询参数类型 */
export class PlaylistParseShareLinkQueryDto extends createZodDto(
  PlaylistParseShareLinkQuerySchema,
) {}

/** 根据歌曲 id 查询参数 */
export const GetSongInfoQuerySchema = z.object({
  songId: z.string().min(1, '歌曲 id 不能为空'),
  cardSecret: z.string(),
});
/** 根据歌曲 id 查询参数类型 */
export class GetSongInfoQueryDto extends createZodDto(GetSongInfoQuerySchema) {}

/** 根据视频 id 查询参数 */
export const GetVideoInfoQuerySchema = z.object({
  videoId: z.string().min(1, '视频 id 不能为空'),
  cardSecret: z.string(),
});
/** 根据视频 id 查询参数类型 */
export class GetVideoInfoQueryDto extends createZodDto(
  GetVideoInfoQuerySchema,
) {}

/** 根据歌单 id 查询参数 */
export const GetPlaylistDetailQuerySchema = z.object({
  playlistId: z.string().min(1, '歌单 id 不能为空'),
  cardSecret: z.string().optional(),
  cursor: z.string().optional(),
  count: z.coerce.number().int().positive().max(1000).optional(),
});
/** 根据歌单 id 查询参数类型 */
export class GetPlaylistDetailQueryDto extends createZodDto(
  GetPlaylistDetailQuerySchema,
) {}

/** 获取歌曲播放链接查询参数 */
export const GetSongPlayUrlQuerySchema = z.object({
  songId: z.string().min(1, '歌曲 id 不能为空'),
  cardSecret: z.string(),
});
/** 获取歌曲播放链接查询参数类型 */
export class GetSongPlayUrlQueryDto extends createZodDto(
  GetSongPlayUrlQuerySchema,
) {}

/** 图片代理查询参数 */
export const ProxyImageQuerySchema = z.object({
  url: z
    .string()
    .min(1, '图片地址不能为空')
    .url('图片地址格式不正确'),
});
/** 图片代理查询参数类型 */
export class ProxyImageQueryDto extends createZodDto(ProxyImageQuerySchema) {}
