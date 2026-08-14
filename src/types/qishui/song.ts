export type IUrl = {
  url: string;
  quality: string;
  size: number;
  format: string;
  encryptionMethod: string;
  playAuth?: string;
  playAuthID?: string;
};

export interface MusicArtist {
  id: string;
  name: string;
  avatar?: string;
}

export type MusicInfo = {
  /** 媒体类型：歌曲分享页 / ugc 视频分享页 */
  type?: 'track' | 'video';
  trackId?: string;
  title?: string;
  artist?: string;
  artists?: MusicArtist[];
  album?: string;
  cover?: string;
  urls?: IUrl[];
  lrc?: string;
  lrcText?: string;
};

export type KrcLyricWord = {
  text: string;
  startMs: number;
  endMs: number;
};

export type KrcLyricSentence = {
  text: string;
  startMs: number;
  endMs: number;
  words: KrcLyricWord[];
  type?: string;
};

export type KrcLyrics = {
  lyricType: 'krc';
  sentences: KrcLyricSentence[];
};

export type AudioWithLyricsOption = {
  trackName?: string;
  artistName?: string;
  trackInfo?: {
    album?: {
      name?: string;
    };
  };
  coverURL?: string;
  url?: string;
  lyrics?: KrcLyrics;
};

export type TrackPageData = {
  track_id?: string;
  audioWithLyricsOption?: AudioWithLyricsOption;
};

/** ugc 视频分享页 videoOptions */
export type UgcVideoOptions = {
  hasCopyright?: boolean;
  metaURL?: string;
  video_id?: string;
  status_code?: number;
  /** 可播放地址 */
  url?: string;
  /** 时长（秒） */
  duration?: number;
  artistName?: string;
  artistThumbAvatarArr?: string[];
  videoName?: string;
  coverURL?: string;
  group_playable_level?: string;
  group_download_level?: string;
  previewStart?: number;
  previewEnd?: number;
  offsetStart?: number;
  offsetDuration?: number;
  firstFrameURL?: string;
  width?: number;
  height?: number;
};

/** ugc 视频分享页 loaderData.ugc_video_page */
export type UgcVideoPageData = {
  video_id?: string;
  video_type?: string;
  videoOptions?: UgcVideoOptions;
  isMobile?: boolean;
  luna_share_node_vid?: string;
};

export type AudioFileFormat = {
  /** 文件扩展名，不包含点，例如 mp3、m4a */
  ext: string;
  /** Blob 或解析结果中的 MIME 类型 */
  mimeType: string;
  /** music-metadata 识别出的容器类型 */
  container?: string;
  /** music-metadata 识别出的编码类型 */
  codec?: string;
};
