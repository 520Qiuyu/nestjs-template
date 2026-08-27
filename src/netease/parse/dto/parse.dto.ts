import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 网易云分享链接解析查询参数 */
export const ParseNeteaseShareLinkQuerySchema = z.object({
  shareLink: z.string().min(1, '分享链接不能为空'),
  cardSecret: z.string().optional(),
});

/** 网易云单曲解析查询参数 */
export class ParseNeteaseSongQueryDto extends createZodDto(
  ParseNeteaseShareLinkQuerySchema,
) {}

/** 网易云歌单解析查询参数 */
export class ParseNeteasePlaylistQueryDto extends createZodDto(
  ParseNeteaseShareLinkQuerySchema,
) {}

/** 网易云专辑解析查询参数 */
export class ParseNeteaseAlbumQueryDto extends createZodDto(
  ParseNeteaseShareLinkQuerySchema,
) {}

/** 网易云歌手解析查询参数 */
export class ParseNeteaseArtistQueryDto extends createZodDto(
  ParseNeteaseShareLinkQuerySchema,
) {}
