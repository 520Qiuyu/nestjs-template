import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 网易云音质档位，对齐 SoundQualityType */
// cspell:ignore exhigh hires jyeffect jymaster
export const NeteaseSoundQualityLevelSchema = z.enum([
  'standard',
  'exhigh',
  'lossless',
  'hires',
  'jyeffect',
  'jymaster',
  'sky',
  'vivid',
]);

/** 获取歌曲详情查询参数 */
export const GetNeteaseSongDetailQuerySchema = z.object({
  id: z.string().min(1, '歌曲 id 不能为空'),
  level: NeteaseSoundQualityLevelSchema.default('exhigh').optional(),
});
/** 获取歌曲详情查询参数类型 */
export class GetNeteaseSongDetailQueryDto extends createZodDto(
  GetNeteaseSongDetailQuerySchema,
) {}
