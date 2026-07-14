import type {
  GetQishuiPlayInfoResponse,
  GetQishuiTrackOptions,
  GetQishuiTrackParams,
  GetQishuiTrackResponse,
  QishuiAuthParams,
} from '@/types/qishui';
import { get, post } from '../utils/request';
import type { IUrl } from '@/types/qishui/song';

/**
 * 获取汽水 PC 端歌曲详情
 * @example
 * ```ts
 * const data = await getQishuiTrack(auth, { trackId: '7647155900515649577' });
 * ```
 */
export const getQishuiTrack = (
  auth: QishuiAuthParams,
  params: GetQishuiTrackParams,
  options: GetQishuiTrackOptions = {},
) => {
  const {
    trackId,
    mediaType = 'track',
    queueType = 'favorite_track_playlist',
    sceneName = 'undefined',
  } = params;

  return post<GetQishuiTrackResponse>(
    '/luna/pc/track_v2',
    auth,
    {
      track_id: trackId,
      media_type: mediaType,
      queue_type: queueType,
      scene_name: sceneName,
    },
    {},
    options,
  );
};

/**
 * 通过 url_player_info 获取歌曲播放链接
 * @example
 * ```ts
 * const data = await getQishuiSongPlayUrl(auth, track_player.url_player_info);
 * const list = data.Result?.Data?.PlayInfoList;
 * ```
 */
export const getQishuiSongPlayUrl = async (
  auth: QishuiAuthParams,
  urlPlayerInfo: string,
) => {
  const res = await get<GetQishuiPlayInfoResponse>(urlPlayerInfo, auth);
  const playInfoList = res.Result?.Data?.PlayInfoList || [];
  const urls: IUrl[] = playInfoList.map((item) => {
    return {
      url: item.MainPlayUrl || item.BackupPlayUrl || '',
      quality: item.Quality,
      size: item.Size,
      format: item.Format,
      encryptionMethod: item.EncryptionMethod,
      playAuth: item.PlayAuth,
      playAuthID: item.PlayAuthID,
    };
  });
  return urls;
};
