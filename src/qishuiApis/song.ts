import axios from 'axios';
import type {
  GetQishuiTrackOptions,
  GetQishuiTrackParams,
  GetQishuiTrackResponse,
  QishuiAuthParams,
  QishuiImage,
} from '@/types/qishui';
import {
  buildQishuiHeaders,
  buildQishuiQueryParams,
  DEFAULT_TIMEOUT,
  QISHUI_BASE_URL,
} from './common';

/**
 * 获取汽水 PC 端歌曲详情
 * @example
 * ```ts
 * const data = await getQishuiTrack(
 *   {
 *     deviceId: '3819028412917803',
 *     cookie: 'sessionid=xxx; ...',
 *     xHelios: 'D04AAMnN...',
 *     xMedusa: 'MLRUasRc...',
 *   },
 *   { trackId: '7647155900515649577' },
 * );
 * ```
 */
export const getQishuiTrack = async (
  auth: QishuiAuthParams,
  params: GetQishuiTrackParams,
  options: GetQishuiTrackOptions = {},
): Promise<GetQishuiTrackResponse> => {
  const {
    trackId,
    mediaType = 'track',
    queueType = 'daily_mix',
    sceneName = 'track_reco',
  } = params;
  const { timeout = DEFAULT_TIMEOUT } = options;
  const body = {
    track_id: trackId,
    media_type: mediaType,
    queue_type: queueType,
    scene_name: sceneName,
  };

  const { data } = await axios.post<GetQishuiTrackResponse>(
    `${QISHUI_BASE_URL}/luna/pc/track_v2`,
    body,
    {
      timeout,
      params: buildQishuiQueryParams(auth, options),
      headers: buildQishuiHeaders(auth, {
        ...options,
        contentType: 'application/json; charset=utf-8',
        body,
      }),
    },
  );

  return data;
};

/**
 * 拼接汽水音乐图片资源地址。
 * @example
 * ```ts
 * const cover = getQishuiImageUrl(track.album?.url_cover);
 * ```
 */
export const getQishuiImageUrl = (image?: QishuiImage | null) => {
  const imageBaseUrl = image?.urls?.find(Boolean) || '';
  if (!imageBaseUrl) {
    return '';
  }

  if (!image?.uri) {
    return imageBaseUrl;
  }

  return `${imageBaseUrl}${imageBaseUrl.endsWith('/') ? '' : '/'}${image.uri}~${image.template_prefix}-crop-center:720:720.jpg`;
};
