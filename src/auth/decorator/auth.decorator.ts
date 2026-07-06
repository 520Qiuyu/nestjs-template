import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 公共路由 不需要进行校验 jwt */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
