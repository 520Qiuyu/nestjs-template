import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 网易云音质档位，对齐 SoundQualityType */
// cspell:ignore exhigh hires jyeffect jymaster
export const NeteaseSoundQualityLevelSchema = z.enum([
  'standard',
  'higher',
  'exhigh',
  'lossless',
  'hires',
  'jyeffect',
  'jymaster',
  'sky',
  'vivid',
  'dolby',
]);

/** 获取歌曲详情查询参数 */
export const GetNeteaseSongDetailQuerySchema = z.object({
  id: z.string().min(1, '歌曲 id 不能为空'),
  level: NeteaseSoundQualityLevelSchema.default('exhigh').optional(),
  cardSecret: z.string().min(1, '卡密不能为空').optional(),
  getDownloadUrl: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .default(false)
    .transform((value) => value === true || value === 'true'),
});
/** 获取歌曲详情查询参数类型 */
export class GetNeteaseSongDetailQueryDto extends createZodDto(
  GetNeteaseSongDetailQuerySchema,
) {}

/** 获取歌曲音质详情查询参数 */
export const GetNeteaseSongQualityQuerySchema = z.object({
  id: z.string().min(1, '歌曲 id 不能为空'),
});
/** 获取歌曲音质详情查询参数类型 */
export class GetNeteaseSongQualityQueryDto extends createZodDto(
  GetNeteaseSongQualityQuerySchema,
) {}

/** 获取歌曲下载地址查询参数 */
export const GetNeteaseSongDownloadQuerySchema = z.object({
  id: z.string().min(1, '歌曲 id 不能为空'),
  level: NeteaseSoundQualityLevelSchema.default('exhigh'),
});
/** 获取歌曲下载地址查询参数类型 */
export class GetNeteaseSongDownloadQueryDto extends createZodDto(
  GetNeteaseSongDownloadQuerySchema,
) {}