import { PaginationQuerySchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const IPV4_REGEXP =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;

/** IPv4 字符串 */
export const Ipv4Schema = z
  .string()
  .trim()
  .min(1, '请输入 IP 地址')
  .regex(IPV4_REGEXP, '请输入合法的 IPv4 地址');

/** 黑名单来源 */
export const BlacklistSourceSchema = z.enum(['manual', 'rate_limit']);

/** 黑名单状态 */
export const BlacklistStatusSchema = z.enum(['active', 'unblocked']);

/** 列表查询 */
export const ListIpBlacklistQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
export class ListIpBlacklistQueryDto extends createZodDto(
  ListIpBlacklistQuerySchema,
) {}

/** 创建黑名单 */
export const CreateIpBlacklistSchema = z.object({
  ip: Ipv4Schema,
  expireAt: z.string().datetime().nullable().optional(),
  reason: z.string().trim().min(1, '请输入拉黑原因').max(200),
  remark: z.string().trim().max(200).optional(),
});
export class CreateIpBlacklistDto extends createZodDto(CreateIpBlacklistSchema) {}

/** 更新黑名单 */
export const UpdateIpBlacklistSchema = z.object({
  ip: Ipv4Schema.optional(),
  expireAt: z.string().datetime().nullable().optional(),
  reason: z.string().trim().min(1).max(200).optional(),
  remark: z.string().trim().max(200).nullable().optional(),
});
export class UpdateIpBlacklistDto extends createZodDto(UpdateIpBlacklistSchema) {}
