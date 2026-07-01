import { z } from 'zod';

/** 获取其他用户信息查询参数 */
export const GetUserInfoQueryDto = z
  .object({
    id: z.string().optional(),
    account: z.string().optional(),
  })
  .refine((data) => data.id || data.account, {
    message: 'id 和 account 至少需要提供一个',
  });
/** 获取其他用户信息查询参数类型 */
export type GetUserInfoQueryDto = z.infer<typeof GetUserInfoQueryDto>;

/** 更新用户信息请求体 */
export const UpdateUserInfoDto = z.object({
  nickname: z.string().min(1).optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  wechat: z.string().optional(),
  qq: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
});
/** 更新用户信息请求体类型 */
export type UpdateUserInfoDto = z.infer<typeof UpdateUserInfoDto>;
