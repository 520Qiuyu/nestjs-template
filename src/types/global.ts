import z from 'zod';

// undefinedToNull
export type UndefinedToNull<T> = undefined extends T ? T | null : T;
// 将interface中的？类型转成 undefined|null类型
export type InterfaceToUndefinedNull<T> = {
  [K in keyof T]: UndefinedToNull<T[K]>;
};

// 响应类型
export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema.nullable(),
  });

export interface Response<T> {
  code: number;
  message: string;
  data: InterfaceToUndefinedNull<T> | null;
}

/** 数据状态枚举 */
export enum Status {
  /** 正常 */
  NORMAL = 'normal',
  /** 禁用 */
  DISABLED = 'disabled',
  /** 删除 */
  DELETED = 'deleted',
}
/** 性别枚举 */
export enum Gender {
  /** 男 */
  MALE = 'male',
  /** 女 */
  FEMALE = 'female',
  /** 未知 */
  UNKNOWN = 'unknown',
}
/** 权限资源类型枚举 */
export enum PermissionResourceType {
  /** 菜单 */
  MENU = 'menu',
  /** 按钮 */
  BUTTON = 'button',
  /** 接口 */
  API = 'api',
}
/** 权限资源请求方法枚举 */
export enum PermissionResourceMethod {
  /** GET */
  GET = 'GET',
  /** POST */
  POST = 'POST',
  /** PUT */
  PUT = 'PUT',
  /** DELETE */
  DELETE = 'DELETE',
  /** PATCH */
  PATCH = 'PATCH',
  /** OPTIONS */
  OPTIONS = 'OPTIONS',
  /** HEAD */
  HEAD = 'HEAD',
}
