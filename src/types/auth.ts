import { z } from 'zod';

/** 登录请求体 */
export const LoginRequestBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
/** 登录请求体类型 */
export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;
