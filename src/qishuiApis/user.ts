import axios from 'axios';
import type { GetQishuiUserInfoOptions, QishuiAuthParams } from '@/types/qishui';
import {
  buildQishuiHeaders,
  buildQishuiQueryParams,
  DEFAULT_TIMEOUT,
  QISHUI_BASE_URL,
} from './common';

/**
 * 获取汽水 PC 端当前登录用户信息
 * @example
 * ```ts
 * const data = await getQishuiUserInfo({
 *   deviceId: '3819028412917803',
 *   cookie: 'sessionid=xxx; ...',
 *   xHelios: 'lkgAABA8...',
 *   xMedusa: 'OrJUas5a...',
 * });
 * ```
 */
export const getQishuiUserInfo = async (
  auth: QishuiAuthParams,
  options: GetQishuiUserInfoOptions = {},
) => {
  const { timeout = DEFAULT_TIMEOUT } = options;
  const { data } = await axios.get(`${QISHUI_BASE_URL}/luna/pc/me`, {
    timeout,
    params: buildQishuiQueryParams(auth, options),
    headers: buildQishuiHeaders(auth, options),
  });

  return data;
};
