import type {
  BuildQishuiHeadersOptions,
  QishuiAuthParams,
  QishuiRequestOptions,
} from '@/types/qishui';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { createHash } from 'node:crypto';

export const QISHUI_BASE_URL = 'https://api.qishui.com';
export const DEFAULT_VERSION_NAME = '3.5.2';
export const DEFAULT_VERSION_CODE = '30050200';
export const DEFAULT_IID = '1958661630215212';
export const DEFAULT_USER_AGENT = `LunaPC/${DEFAULT_VERSION_NAME}(412998333)`;
export const DEFAULT_TIMEOUT = 15000;

/** mac 端 os_version（与客户端上报一致） */
export const DEFAULT_OS_VERSION =
  'Darwin Kernel Version 25.5.0: Tue Jun  9 22:26:22 PDT 2026; root:xnu-12377.121.10~1/RELEASE_ARM64_T8132';

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
    channel: 'official',
    build_mode: 'master',
    network_carrier: '',
    ac: 'wifi',
    tz_name: 'Asia/Shanghai',
    resolution: '',
    device_platform: 'mac',
    device_type: 'MacOS',
    os_version: DEFAULT_OS_VERSION,
    fp,
  };
};

/**
 * 构建汽水公共请求头
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
    'x-helios': auth.xHelios || '',
    'x-medusa': auth.xMedusa || '',
    Cookie: auth.cookie,
    // luna mac 端固定头
    'x-luna-background-type': 'foreground',
    'x-luna-is-background-req': '0',
    'x-luna-is-local-user': '1',
    'Accept-Encoding': 'gzip, deflate',
  };

  // 以下为每次请求的动态签名头，存在才写入
  if (auth.xArgus) headers['x-argus'] = auth.xArgus;
  if (auth.xGorgon) headers['x-gorgon'] = auth.xGorgon;
  if (auth.xLadon) headers['x-ladon'] = auth.xLadon;
  if (auth.xKhronos) headers['x-khronos'] = auth.xKhronos;
  if (auth.xSsStub) headers['x-ss-stub'] = auth.xSsStub;
  if (auth.xTtTraceId) headers['x-tt-trace-id'] = auth.xTtTraceId;

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
};

const axiosInstance = axios.create({
  baseURL: QISHUI_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

/**
 * 将请求体转换为最终发送的 JSON，并生成汽水校验摘要
 * @example
 * ```ts
 * const result = buildQishuiBodySignature({ track_id: '123' });
 * // result.stub === MD5(result.serializedBody).toUpperCase()
 * ```
 */
const buildQishuiBodySignature = (body: unknown) => {
  const serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
  const stub = createHash('md5')
    .update(serializedBody)
    .digest('hex')
    .toUpperCase();

  return { serializedBody, stub };
};

axiosInstance.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() !== 'post' || config.data === undefined) {
    return config;
  }

  const { serializedBody, stub } = buildQishuiBodySignature(config.data);
  config.data = serializedBody;
  config.headers.set('x-ss-stub', stub);
  config.headers.set('x-luna-background-type', 'foreground');
  config.headers.set('x-luna-is-background-req', '0');
  config.headers.set('x-luna-is-local-user', '1');

  return config;
});

/**
 * 合并汽水公共 query / headers
 */
const buildConfig = (
  auth: QishuiAuthParams,
  options: QishuiRequestOptions = {},
  config: AxiosRequestConfig = {},
): AxiosRequestConfig => {
  const { timeout = DEFAULT_TIMEOUT } = options;
  const { params, headers, ...rest } = config;

  return {
    timeout,
    ...rest,
    params: {
      ...buildQishuiQueryParams(auth, options),
      ...(params as Record<string, unknown> | undefined),
    },
    headers: {
      ...buildQishuiHeaders(auth, {
        ...options,
        contentType: 'application/json; charset=utf-8',
      }),
      ...(headers as Record<string, string> | undefined),
    },
  };
};

/**
 * 汽水 GET 请求
 * @example
 * ```ts
 * const data = await get('/luna/pc/me', auth);
 * ```
 */
export const get = async <R = any>(
  url: string,
  auth: QishuiAuthParams,
  config: AxiosRequestConfig = {},
  options: QishuiRequestOptions = {},
) => {
  const { data } = await axiosInstance.get<R>(
    url,
    buildConfig(auth, options, config),
  );
  return data;
};

/**
 * 汽水 POST 请求
 * @example
 * ```ts
 * const data = await post('/luna/pc/track_v2', auth, { track_id: 'xxx' });
 * ```
 */
export const post = async <R = any>(
  url: string,
  auth: QishuiAuthParams,
  body?: unknown,
  config: AxiosRequestConfig = {},
  options: QishuiRequestOptions = {},
) => {
  const { data } = await axiosInstance.post<R>(
    url,
    body,
    buildConfig(auth, options, config),
  );
  return data;
};

export default axiosInstance;
