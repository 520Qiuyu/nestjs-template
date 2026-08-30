import type { NeteaseAlbum } from './album';
import type { NeteaseArtist } from './artist';
import type {
  NeteaseFreeTrialPrivilege,
  NeteasePrivilege,
} from './privilege';

/** 网易云歌曲音质档位枚举 */
export type SoundQualityType =
  | 'standard' // 标准
  | 'higher' // 较高
  | 'exhigh' // 极高
  | 'lossless' // 无损
  | 'hires' // Hi-Res
  | 'jyeffect' // 高清臻音
  | 'dolby' // 杜比全景声
  | 'vivid' // 臻音全景声
  | 'jymaster' // 超清母带
  | 'sky'; // 沉浸环绕声

/** 网易云限时试听区间（秒） */
export interface NeteaseSongFreeTrialInfo {
  start: number;
  end: number;
}

/** 网易云限时试听权益 */
export interface NeteaseFreeTimeTrialPrivilege {
  resConsumable: boolean;
  userConsumable: boolean;
  type: number;
  remainTime: number;
}

/** 网易云歌曲播放 / 下载地址 */
export interface NeteaseSongUrl {
  /** 歌曲 ID */
  id: number;
  /** 音频地址，无权限时为 null */
  url: string | null;
  /** 码率 */
  br: number;
  /** 文件大小（字节） */
  size: number;
  md5: string | null;
  code: number;
  /** 链接过期时间（秒） */
  expi: number;
  /** 封装格式，如 mp3 / flac */
  type: string | null;
  gain: number;
  peak?: number;
  fee: number;
  uf: unknown | null;
  payed: number;
  flag: number;
  canExtend: boolean;
  freeTrialInfo: NeteaseSongFreeTrialInfo | null;
  /** 实际音质档位 */
  level: SoundQualityType | null;
  encodeType: string | null;
  channelLayout?: unknown | null;
  unofficial?: boolean;
  officialVideoType?: unknown | null;
  now?: unknown | null;
  effectTypes?: unknown | null;
  podcastCtrp?: unknown | null;
  /** 时长（毫秒） */
  time?: number;
  message?: string | null;
  freeTrialPrivilege?: NeteaseFreeTrialPrivilege;
  freeTimeTrialPrivilege?: NeteaseFreeTimeTrialPrivilege;
  urlSource?: number;
  rightSource?: number;
}

/** 网易云歌曲音质档位 */
export interface NeteaseSongQuality {
  /** 码率 */
  br: number;
  fid: number;
  /** 文件大小（字节） */
  size: number;
  /** 音量增益 */
  vd: number;
  /** 采样率 */
  sr: number;
  /** 编码标识，如 aac / ste / c51，仅部分档位返回 */
  it?: string;
}

/** 歌曲音质详情（song_music_detail） */
export interface NeteaseSongQualityData {
  songId: number;
  /** 高品质 320k */
  h: NeteaseSongQuality | null;
  /** 中品质 192k */
  m: NeteaseSongQuality | null;
  /** 标准 128k */
  l: NeteaseSongQuality | null;
  /** 无损 */
  sq: NeteaseSongQuality | null;
  /** Hi-Res */
  hr: NeteaseSongQuality | null;
  /** 杜比全景声 */
  db: NeteaseSongQuality | null;
  /** 超清母带 */
  jm: NeteaseSongQuality | null;
  /** 高清臻音 */
  je: NeteaseSongQuality | null;
  /** 沉浸环绕声 */
  sk: NeteaseSongQuality | null;
  /** 沉浸环绕声多编码 */
  sks: NeteaseSongQuality[] | null;
  /** 臻音全景声 */
  vi: NeteaseSongQuality | null;
}

/** 网易云歌曲（歌单 tracks / track-all songs） */
export interface NeteaseSong {
  /** 歌曲名 */
  name: string;
  mainTitle: string | null;
  additionalTitle: string | null;
  /** 歌曲 ID */
  id: number;
  pst: number;
  t: number;
  /** 艺人列表 */
  ar: NeteaseArtist[];
  /** 歌曲别名 */
  alia: string[];
  pop: number;
  st: number;
  rt: string;
  /** 收费类型 */
  fee: number;
  v: number;
  crbt: unknown | null;
  cf: string;
  /** 所属专辑 */
  al: NeteaseAlbum;
  /** 时长（毫秒） */
  dt: number;
  /** 高品质 */
  h: NeteaseSongQuality | null;
  /** 中品质 */
  m: NeteaseSongQuality | null;
  /** 标准品质 */
  l: NeteaseSongQuality | null;
  /** 无损 */
  sq: NeteaseSongQuality | null;
  /** Hi-Res */
  hr: NeteaseSongQuality | null;
  a: unknown | null;
  cd: string;
  no: number;
  rtUrl: string | null;
  ftype: number;
  rtUrls: unknown[];
  djId: number;
  copyright: number;
  s_id: number;
  mark: number;
  originCoverType: number;
  originSongSimpleData: unknown | null;
  tagPicList: unknown | null;
  resourceState: boolean;
  version: number;
  songJumpInfo: unknown | null;
  entertainmentTags: unknown | null;
  awardTags: unknown | null;
  displayTags: unknown | null;
  artistClassics: boolean;
  markTags: unknown[];
  songFeature: unknown | null;
  single: number;
  /** 无版权推荐，有值表示不可播 */
  noCopyrightRcmd: unknown | null;
  /** 歌单详情 tracks 可能返回 */
  alg?: string | null;
  /** 歌单详情 tracks 可能返回 */
  displayReason?: string | null;
  /** 歌单详情 tracks 可能返回 */
  pubDJProgramData?: unknown | null;
  mv: number;
  rtype: number;
  rurl: string | null;
  mst: number;
  cp: number;
  /** 发行时间戳 */
  publishTime: number;
}

/** 歌曲详情单条（song_detail 取第一条） */
export interface NeteaseSongDetail {
  song?: NeteaseSong;
  privileges?: NeteasePrivilege;
}



/** 处理后的歌词 */
export interface NeteaseSongLyric {
  /** 带时间轴的 LRC */
  lrc: string;
  /** 去掉时间轴的纯文本 */
  lrcText: string;
}

/** 获取歌曲详情接口 data */
export interface NeteaseSongDetailData {
  detail: NeteaseSongDetail;
  // download: NeteaseSongUrl | null;
  lyric: NeteaseSongLyric;
  quality: NeteaseSongQualityData | null;
}

/** 单曲解析裁剪后的下载信息 */
export interface NeteaseParseSongUrl {
  url: string | null;
  size: number;
  type: string | null;
  encodeType: string | null;
  level: SoundQualityType | null;
}

/** 单曲解析裁剪后的歌词 */
export type NeteaseParseSongLyric = NeteaseSongLyric;

/** 单曲解析裁剪后的歌曲 */
export interface NeteaseParseSong {
  id: number;
  name: string;
  ar: Array<{ id: number; name: string }>;
  al?: { id: number; name: string; picUrl: string };
  dt?: number;
  fee?: number;
  noCopyrightRcmd?: unknown | null;
}

/** 单曲解析接口 data */
export interface NeteaseParseSongData {
  song: NeteaseParseSong | null;
  download: NeteaseParseSongUrl | null;
  lyric: NeteaseParseSongLyric;
  quality: NeteaseSongQualityData | null;
}
