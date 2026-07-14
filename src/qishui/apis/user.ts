import type { GetQishuiUserInfoOptions, QishuiAuthParams } from '@/types/qishui';
import { get } from '../utils/request';

/**
 * 获取汽水 PC 端当前登录用户信息
 * @example
 * ```ts
 * const data = await getQishuiUserInfo(auth);
 * ```
 */
export const getQishuiUserInfo = (
  auth: QishuiAuthParams,
  options: GetQishuiUserInfoOptions = {},
) => get('/luna/pc/me', auth, {}, options);
