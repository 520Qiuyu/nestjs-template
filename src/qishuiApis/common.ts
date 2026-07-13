import { createHash } from 'crypto';
import type {
  BuildQishuiHeadersOptions,
  QishuiAuthParams,
  QishuiRequestOptions,
} from '@/types/qishui';

export const QISHUI_BASE_URL = 'https://api.qishui.com';
export const DEFAULT_VERSION_NAME = '3.5.2';
export const DEFAULT_VERSION_CODE = '30050200';
export const DEFAULT_USER_AGENT = `LunaPC/${DEFAULT_VERSION_NAME}(412998333)`;
export const DEFAULT_TIMEOUT = 15000;

/**
 * 构建汽水公共 query 参数
 * @example
 * ```ts
 * buildQishuiQueryParams(auth, options)
 * ```
 */
export const buildQishuiQueryParams = (
  auth: Pick<QishuiAuthParams, 'deviceId'>,
  options: QishuiRequestOptions = {},
) => {
  const {
    iid = '',
    fp = auth.deviceId,
    versionName = DEFAULT_VERSION_NAME,
    versionCode = DEFAULT_VERSION_CODE,
  } = options;

  return {
    aid: '386088',
    app_name: 'luna_pc',
    region: 'cn',
    geo_region: 'cn',
    os_region: 'cn',
    sim_region: '',
    device_id: auth.deviceId,
    cdid: '',
    iid,
    version_name: versionName,
    version_code: versionCode,
    channel: 'ug',
    build_mode: 'master',
    network_carrier: '',
    ac: 'wifi',
    tz_name: 'Asia/Shanghai',
    resolution: '',
    device_platform: 'windows',
    device_type: 'Windows',
    os_version: 'Windows 11 Pro',
    fp,
  };
};

/**
 * 构建汽水公共请求头
 * @example
 * ```ts
 * buildQishuiHeaders(auth, { contentType: 'application/json; charset=utf-8', body: payload })
 * ```
 */
export const buildQishuiHeaders = (
  auth: QishuiAuthParams,
  options: BuildQishuiHeadersOptions = {},
) => {
  const { userAgent = DEFAULT_USER_AGENT, contentType, body } = options;
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept-Encoding': 'gzip, deflate',
    'x-helios': auth.xHelios,
    'x-medusa': auth.xMedusa,
    'x-luna-background-type': 'foreground',
    'x-luna-is-background-req': '0',
    'x-luna-is-local-user': '1',
    Cookie: auth.cookie,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (body !== undefined) {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    headers['x-ss-stub'] = createHash('md5').update(raw).digest('hex').toUpperCase();
  }

  return headers;
};
