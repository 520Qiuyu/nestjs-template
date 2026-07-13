import type {
  BuildQishuiHeadersOptions,
  QishuiAuthParams,
  QishuiRequestOptions,
} from '@/types/qishui';

export const QISHUI_BASE_URL = 'https://api.qishui.com';
export const DEFAULT_VERSION_NAME = '3.4.0';
export const DEFAULT_VERSION_CODE = '30040000';
export const DEFAULT_IID = '3717874987061322';
export const DEFAULT_USER_AGENT = `LunaPC/${DEFAULT_VERSION_NAME}(388267242)`;
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
    iid = DEFAULT_IID,
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
 * 构建汽水公共请求头（与可用版 trackV2 保持一致）
 * @example
 * ```ts
 * buildQishuiHeaders(auth, { contentType: 'application/json; charset=utf-8' })
 * ```
 */
export const buildQishuiHeaders = (
  auth: QishuiAuthParams,
  options: BuildQishuiHeadersOptions = {},
) => {
  const { userAgent = DEFAULT_USER_AGENT, contentType } = options;
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'x-helios': auth.xHelios,
    'x-medusa': auth.xMedusa,
    Cookie: auth.cookie,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
};
