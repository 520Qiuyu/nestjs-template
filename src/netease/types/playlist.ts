import type { NeteasePrivilege } from './privilege';
import type { NeteaseSong } from './song';
import type { NeteaseUser } from './user';

/** 歌单曲目 ID 项 */
export interface NeteasePlaylistTrackId {
  id: number;
  v: number;
  t: number;
  at: number;
  alg: string | null;
  uid: number;
  rcmdReason: string;
  rcmdReasonTitle: string;
  sc: unknown | null;
  f: unknown | null;
  sr: unknown | null;
  dpr: unknown | null;
  tr: number;
}

/** 网易云歌单主体 */
export interface NeteasePlaylist {
  /** 歌单 ID */
  id: number;
  /** 歌单名称 */
  name: string;
  coverImgId: number;
  /** 封面地址 */
  coverImgUrl: string;
  coverImgId_str: string;
  adType: number;
  userId: number;
  /** 创建时间戳 */
  createTime: number;
  status: number;
  opRecommend: boolean;
  highQuality: boolean;
  newImported: boolean;
  updateTime: number;
  /** 歌曲数量 */
  trackCount: number;
  specialType: number;
  privacy: number;
  trackUpdateTime: number;
  commentThreadId: string;
  /** 播放量 */
  playCount: number;
  trackNumberUpdateTime: number;
  /** 收藏数 */
  subscribedCount: number;
  cloudTrackCount: number;
  ordered: boolean;
  /** 简介 */
  description: string | null;
  /** 标签 */
  tags: string[];
  updateFrequency: string | null;
  backgroundCoverId: number;
  backgroundCoverUrl: string | null;
  titleImage: number;
  titleImageUrl: string | null;
  detailPageTitle: string | null;
  englishTitle: string | null;
  officialPlaylistType: string | null;
  copied: boolean;
  relateResType: string | null;
  coverStatus: number;
  mix: boolean;
  subscribers: NeteaseUser[];
  subscribed: boolean | null;
  /** 创建者 */
  creator: NeteaseUser;
  /** 预览曲目（通常最多约 1000 首，完整列表走 track-all） */
  tracks: NeteaseSong[];
  videoIds: unknown | null;
  videos: unknown | null;
  trackIds: NeteasePlaylistTrackId[];
  bannedTrackIds: unknown | null;
  mvResourceInfos: unknown | null;
  shareCount: number;
  commentCount: number;
  remixVideo: unknown | null;
  newDetailPageRemixVideo: unknown | null;
  sharedUsers: unknown | null;
  historySharedUsers: unknown | null;
  gradeStatus: string;
  score: unknown | null;
  algTags: unknown | null;
  distributeTags: unknown[];
  trialMode: number;
  displayTags: unknown | null;
  displayUserInfoAsTagOnly: boolean;
  playlistType: string;
  uiPlaylistType: string;
  bizExtInfo: Record<string, unknown>;
  promptedMgcInfo: unknown | null;
  mixPodcastPlaylist: boolean;
  podcastTrackCount: number;
  mixInfo: unknown | null;
}

/** 获取歌单详情 `playlist_detail` 返回体 */
export interface NeteasePlaylistDetail {
  code: number;
  relatedVideos: unknown | null;
  playlist: NeteasePlaylist;
  urls: unknown | null;
  privileges: NeteasePrivilege[];
  sharedPrivilege: unknown | null;
  resEntrance: unknown | null;
  fromUsers: unknown | null;
  fromUserCount: number;
  songFromUsers: unknown | null;
}

/** 获取歌单所有歌曲 `playlist_track_all` 返回体 */
export interface NeteasePlaylistTrackAll {
  code: number;
  songs: NeteaseSong[];
  privileges: NeteasePrivilege[];
}
