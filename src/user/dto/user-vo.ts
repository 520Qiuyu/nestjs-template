import { createResponseSchema, Status } from '@/types/global';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

/** 获取用户信息响应体 */
export const GetUserInfoResponseSchema = z.object({
  id: z.string(),
  account: z.string(),
  nickname: z.string().nullish(),
  avatar: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  wechat: z.string().nullish(),
  qq: z.string().nullish(),
  gender: z.string().nullish(),
  birthday: z.date().nullish(),
  status: z.enum(Status),
});
/** 获取用户信息响应体形状 */
export type UserInfoResponse = z.infer<typeof GetUserInfoResponseSchema>;
/** 获取用户信息响应体类型 */
export class GetUserInfoResponseDto extends createZodDto(
  createResponseSchema(GetUserInfoResponseSchema),
) {}
