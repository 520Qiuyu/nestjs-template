import { z } from 'zod';

/** 登录请求体 */
export const LoginRequestBodySchema = z.object({
  account: z.string().min(1),
  password: z.string().min(1),
});
/** 登录请求体类型 */
export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;

/** 注册请求体 */
export const RegisterRequestBodySchema = z.object({
  account: z.string().min(5),
  password: z.string().min(6),
});
/** 注册请求体类型 */
export type RegisterRequestBody = z.infer<typeof RegisterRequestBodySchema>;
