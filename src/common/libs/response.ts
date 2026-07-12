import type { Response } from 'src/types/global';

/** 生成成功响应数据 */
export function generateOk<T>(
  data: T,
  options?: Partial<Omit<Response<T>, 'data'>>,
): Response<T> {
  const { code = 200, message = '操作成功！' } = options || {};
  return {
    code,
    message,
    data,
  };
}

/** 生成失败响应数据 */
export function generateError<T>(
  message: string,
  options?: Partial<Omit<Response<T>, 'message'>>,
): Response<T> {
  const { code = 500, data = null } = options || {};
  return {
    code,
    message,
    data,
  };
}

/** 生成未授权响应数据 */
export function generateUnauthorized<T>(
  message: string,
  options?: Partial<Omit<Response<T>, 'message'>>,
): Response<T> {
  const { code = 401, data = null } = options || {};
  return {
    code,
    message,
    data,
  };
}

/** 生成无权限响应数据 */
export function generateForbidden<T>(
  message: string,
  options?: Partial<Omit<Response<T>, 'message'>>,
): Response<T> {
  const { code = 403, data = null } = options || {};
  return {
    code,
    message,
    data,
  };
}

/** 生成响应数据 */
export function generateResponse<T>(options: Response<T>): Response<T> {
  return options;
}
