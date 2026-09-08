import type { NeteaseParseSong } from './song';

/** 网易云专辑（歌曲 al） */
export interface NeteaseAlbum {
  /** 专辑 ID */
  id: number;
  /** 专辑名称 */
  name: string;
  /** 封面地址 */
  picUrl: string;
  /** 翻译名 */
  tns: string[];
  /** 封面 ID 字符串 */
  pic_str: string;
  /** 封面 ID */
  pic: number;
}

/** 专辑详情中的艺人（仅展示所需字段） */
export interface NeteaseAlbumArtist {
  id: number;
  name: string;
  picUrl?: string;
}

/** 专辑详情主体（裁剪后） */
export interface NeteaseAlbumInfo {
  /** 专辑 ID */
  id: number;
  /** 专辑名称 */
  name: string;
  /** 封面地址 */
  picUrl: string;
  /** 发行时间戳 */
  publishTime: number;
  /** 发行公司 */
  company: string | null;
  /** 简介 */
  description: string | null;
  /** 主艺人 */
  artist: NeteaseAlbumArtist;
  /** 曲目数量 */
  size: number;
  /** 专辑类型，如 专辑 / EP */
  type?: string;
  /** 子类型，如 录音室版 */
  subType?: string;
  /** 别名 */
  alias?: string[];
}

/** 专辑曲目权限（试听判断） */
export interface NeteaseAlbumSongPrivilege {
  id: number;
  fee?: number;
  st?: number;
  pl?: number;
}

/** 获取专辑详情返回 data（裁剪后） */
export interface NeteaseAlbumDetail {
  album: NeteaseAlbumInfo;
  songs: NeteaseParseSong[];
  privileges: NeteaseAlbumSongPrivilege[];
}
