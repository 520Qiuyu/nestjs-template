import type { QishuiAuthParams, QishuiRequestOptions } from '@/types/qishui';
import type {
  GetQishuiPlaylistDetailParams,
  GetQishuiPlaylistDetailResponse,
} from '@/types/qishui/platlist';
import { get } from '../utils/request';

/**
 * 获取汽水 PC 端歌单详情
 * @example
 * ```ts
 * const data = await getQishuiPlaylistDetail(auth, { playlistId: '7380550365186621459' });
 * ```
 */
export const getQishuiPlaylistDetail = (
  auth: QishuiAuthParams,
  params: GetQishuiPlaylistDetailParams,
  options: QishuiRequestOptions = {},
) => {
  const { playlistId, cursor = '', count = 1000 } = params;

  return get<GetQishuiPlaylistDetailResponse>(
    '/luna/pc/playlist/detail',
    auth,
    {
      params: {
        playlist_id: playlistId,
        cursor,
        count,
      },
    },
    options,
  );
};
