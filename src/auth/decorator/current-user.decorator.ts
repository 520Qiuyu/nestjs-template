import {
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Request } from 'express';

/**
 * 获取当前登录用户
 *
 * - 不传参数：返回完整 `user`
 * - 传入属性名：返回对应属性值
 *
 * @example
 * ```ts
 * create(@CurrentUser() user: User) {}
 * create(@CurrentUser('id') userId: string) {}
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
