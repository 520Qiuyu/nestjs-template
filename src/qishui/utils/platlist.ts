import type {
  AlbumPageData,
  GetQishuiPlaylistDetailResponse,
  PlaylistInfo,
  PlaylistMedia,
  PlaylistMusicInfo,
  PlaylistTrack,
  PlaylistVideo,
  RawPlaylistInfo,
} from '@/types/qishui/platlist';
import { getQishuiImageUrl, parseRouterData } from '.';

export const getQishuiMusicUrl = (id: string) => {
  return `https://music.douyin.com/qishui/share/track?track_id=${id}`;
};

/**
 * 生成歌单分享页地址
 * @example
 * getQishuiPlaylistUrl('7380550365186621459')
 */
export const getQishuiPlaylistUrl = (id: string) => {
  return `https://music.douyin.com/qishui/share/playlist?playlist_id=${id}`;
};

const formatPlaylistArtists = (
  artists?: Array<{ name?: string }> | null,
) => {
  const artistNames =
    artists?.map((artist) => artist.name).filter(Boolean) || [];

  return artistNames.length > 0 ? artistNames.join(' / ') : '未知歌手';
};

/**
 * 判断歌曲是否只能试听。
 *
 * @example
 * const isPreviewOnly = isPlaylistPreviewOnlyTrack(track);
 */
const isPlaylistPreviewOnlyTrack = (track: PlaylistTrack) =>
  track.limited_free_info != null;

/**
 * 获取歌单内用于展示和试听判断的时长。
 *
 * @example
 * const previewDuration = getPlaylistPreviewDuration(track, isPreviewOnly);
 */
const getPlaylistPreviewDuration = (
  track: PlaylistTrack,
  isPreviewOnly: boolean,
) => {
  if (!isPreviewOnly) {
    return track.duration;
  }

  return track.preview?.duration;
};

/**
 * 将歌单曲目结构转换为页面可复用的音乐信息。
 *
 * @example
 * const musicInfo = formatPlaylistMusicInfo(media.entity?.track);
 */
const formatPlaylistMusicInfo = (
  track?: PlaylistTrack,
): PlaylistMusicInfo | null => {
  if (!track) {
    return null;
  }
  const isPreviewOnly = isPlaylistPreviewOnlyTrack(track);

  return {
    type: 'track',
    id: track.id,
    title: track.name || '未知歌曲',
    artist: formatPlaylistArtists(track.artists),
    album: track.album?.name || '未知专辑',
    cover:
      getQishuiImageUrl(track.album?.url_cover) ||
      'https://via.placeholder.com/120',
    duration: track.duration,
    previewDuration: getPlaylistPreviewDuration(track, isPreviewOnly),
    isPreviewOnly,
    collectCount: track.stats?.count_collected,
    commentCount: track.stats?.count_comment,
    shareCount: track.stats?.count_shared,
  } as any;
};

/**
 * 将歌单内视频实体转换为页面可复用的音乐信息。
 *
 * @example
 * const musicInfo = formatPlaylistVideoMusicInfo(media.entity?.video);
 */
const formatPlaylistVideoMusicInfo = (
  video?: PlaylistVideo,
): PlaylistMusicInfo | null => {
  if (!video) {
    return null;
  }

  return {
    type: 'video',
    id: video.video_id || video.vid,
    title: video.title || video.description || '未知歌曲',
    artist: formatPlaylistArtists(video.artists),
    album: '未知专辑',
    cover:
      getQishuiImageUrl(video.cover_url) ||
      getQishuiImageUrl(video.share_cover_url) ||
      getQishuiImageUrl(video.image_url) ||
      'https://via.placeholder.com/120',
    duration: video.duration,
    previewDuration: video.duration,
    isPreviewOnly: false,
    collectCount: video.stats?.count_collected,
    commentCount: video.stats?.count_comment,
    shareCount: video.stats?.count_shared,
  } as any;
};

/**
 * 从歌单媒体项中取出歌曲 / 视频实体
 * @example
 * const track = getPlaylistMediaTrack(media);
 */
const getPlaylistMediaTrack = (media?: PlaylistMedia) =>
  media?.entity?.track || media?.entity?.track_wrapper?.track;

/**
 * 从歌单媒体项中取出视频实体
 * @example
 * const video = getPlaylistMediaVideo(media);
 */
const getPlaylistMediaVideo = (media?: PlaylistMedia) =>
  media?.entity?.video || media?.entity?.video_wrapper?.video;

/**
 * 将歌单媒体列表格式化为页面可复用的曲目信息
 * @example
 * const tracks = formatPlaylistMedias(medias);
 */
const formatPlaylistMedias = (medias?: PlaylistMedia[] | null) =>
  medias
    ?.map((media) => {
      const track = getPlaylistMediaTrack(media);
      if (track) {
        return formatPlaylistMusicInfo(track);
      }
      const video = getPlaylistMediaVideo(media);
      if (video) {
        return formatPlaylistVideoMusicInfo(video);
      }
      return null;
    })
    .filter((track): track is PlaylistMusicInfo => Boolean(track)) || [];

/**
 * 将原始歌单信息 + 媒体列表归一化为与分享页一致的结构
 * @example
 * const routerData = normalizePlaylistInfo(playlist, media_resources);
 */
export const normalizePlaylistInfo = (
  rawPlaylistInfo: RawPlaylistInfo,
  medias?: PlaylistMedia[] | null,
): PlaylistInfo => {
  const tracks = formatPlaylistMedias(medias);

  return {
    id: rawPlaylistInfo.id,
    title: rawPlaylistInfo.title || rawPlaylistInfo.public_title || '未知歌单',
    cover:
      getQishuiImageUrl(rawPlaylistInfo.url_cover) ||
      'https://via.placeholder.com/120',
    owner:
      rawPlaylistInfo.owner?.nickname ||
      rawPlaylistInfo.owner?.public_name ||
      '未知用户',
    countTracks:
      rawPlaylistInfo.count_tracks ||
      rawPlaylistInfo.resource_cnt?.track_cnt ||
      tracks.length ||
      0,
    tracks,
    source: 'playlist',
  };
};

/**
 * 将专辑分享页曲目列表格式化为页面可复用的曲目信息
 * @example
 * const tracks = formatAlbumTrackList(albumPage.trackList);
 */
const formatAlbumTrackList = (trackList?: PlaylistTrack[] | null) =>
  trackList
    ?.map((track) => formatPlaylistMusicInfo(track))
    .filter((track): track is PlaylistMusicInfo => Boolean(track)) || [];

/**
 * 将专辑分享页数据归一化为与歌单解析一致的结构
 * @example
 * const albumInfo = normalizeAlbumInfo(albumPage);
 */
export const normalizeAlbumInfo = (albumPage: AlbumPageData): PlaylistInfo => {
  const albumInfo = albumPage.albumInfo;
  if (!albumInfo) {
    throw new Error('未找到专辑信息');
  }

  const tracks = formatAlbumTrackList(albumPage.trackList);

  return {
    id: albumInfo.id,
    title: albumInfo.name || '未知专辑',
    cover:
      getQishuiImageUrl(albumInfo.url_cover) ||
      'https://via.placeholder.com/120',
    owner: formatPlaylistArtists(albumInfo.artists),
    countTracks: albumInfo.count_tracks || tracks.length || 0,
    tracks,
    source: 'album',
  };
};

/**
 * 将 PC 歌单详情接口响应归一化为与分享链接解析一致的结构
 * @example
 * const routerData = normalizePlaylistDetailResponse(detail);
 */
export const normalizePlaylistDetailResponse = (
  detail: GetQishuiPlaylistDetailResponse,
): PlaylistInfo => {
  if (!detail.playlist) {
    throw new Error('未找到歌单信息');
  }
  return normalizePlaylistInfo(detail.playlist, detail.media_resources);
};

/**
 * 解析歌单信息。
 *
 * @example
 * const playlistInfo = await parsePlaylistInfo(html);
 */
export const parsePlaylistInfo = async (html: string) => {
  if (!html) {
    throw new Error('请传入页面 HTML 内容');
  }
  const routerData = parseRouterData(html);
  const playlistPage = routerData?.loaderData?.playlist_page;
  const albumPage = routerData?.loaderData?.album_page;

  if (playlistPage?.playlistInfo) {
    return normalizePlaylistInfo(playlistPage.playlistInfo, playlistPage.medias);
  }

  if (albumPage?.albumInfo) {
    return normalizeAlbumInfo(albumPage);
  }

  throw new Error('未找到歌单或专辑信息');
};
