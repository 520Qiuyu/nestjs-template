import type {
  GetQishuiPlayInfoResponse,
  GetQishuiTrackOptions,
  GetQishuiTrackParams,
  GetQishuiTrackResponse,
  QishuiAuthParams,
} from '@/types/qishui';
import type { IUrl, UgcVideoPageData } from '@/types/qishui/song';
import { parseRouterData } from '../utils';
import { get, post } from '../utils/request';

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
    queueType = 'self_playlist',
    sceneName = 'library',
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
 * 根据视频 id 获取 ugc 视频分享页数据
 * @example
 * ```ts
 * const page = await getQishuiVideo('7639280897337855278');
 * ```
 * @see https://music.douyin.com/qishui/share/ugc_video?ugc_video_id=7639280897337855278
 */
export const getQishuiVideo = async (id: string): Promise<UgcVideoPageData> => {
  const url = `https://music.douyin.com/qishui/share/ugc_video?ugc_video_id=${id}`;
  const html = await fetch(url).then((res) => res.text());
  const routerData = parseRouterData(html);
  const page = routerData?.loaderData?.ugc_video_page;
  if (!page?.videoOptions) {
    throw new Error('未找到视频信息');
  }
  return page;
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
