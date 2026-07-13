/** 汽水图片资源 */
export interface QishuiImage {
  /** 图片 URI */
  uri?: string;
  /** 图片 CDN 前缀列表 */
  urls?: string[];
  /** 模板前缀 */
  template_prefix?: string;
}

/** 汽水艺人 */
export interface QishuiArtist {
  id: string;
  name: string;
  url_avatar?: QishuiImage;
  simple_display_name?: string;
}

/** 汽水专辑 */
export interface QishuiAlbum {
  id: string;
  name: string;
  /** 封面图 */
  url_cover?: QishuiImage;
  /** 播放页背景图 */
  url_player_bg?: QishuiImage;
  /** 发行时间（秒级时间戳） */
  release_date?: number;
}

/** 汽水歌词 */
export interface QishuiLyric {
  /** 歌词正文（krc 等） */
  content?: string;
  /** 歌词类型，如 krc */
  type?: string;
  hide_request_lyrics?: boolean;
}

/** 汽水码率信息 */
export interface QishuiBitRate {
  br: number;
  size: number;
  quality: string;
}

/** 汽水歌曲主体 */
export interface QishuiTrack {
  id: string;
  name: string;
  /** 时长（毫秒） */
  duration?: number;
  /** 音视频资源 ID */
  vid?: string;
  album?: QishuiAlbum;
  artists?: QishuiArtist[];
  bit_rates?: QishuiBitRate[];
  media_type?: string;
}

/** 汽水播放资源条目（video_model 解析后） */
export interface QishuiPlayVideoItem {
  main_url?: string;
  backup_url?: string;
  video_meta?: {
    quality?: string;
    vtype?: string;
    bitrate?: number;
    codec_type?: string;
    size?: number;
  };
  encrypt_info?: {
    encrypt?: boolean;
    kid?: string;
    spade_a?: string;
    encryption_method?: string;
  };
}

/** 汽水播放模型（video_model JSON 解析后） */
export interface QishuiVideoModel {
  status?: number;
  message?: string;
  video_id?: string;
  video_duration?: number;
  media_type?: string;
  url_expire?: number;
  video_list?: QishuiPlayVideoItem[];
}

/** 汽水播放器信息 */
export interface QishuiTrackPlayer {
  /** 过期时间（秒级时间戳） */
  expire_at?: number;
  media_id?: string;
  url_player_info?: string;
  /** video_model JSON 字符串，可用 JSON.parse 转为 QishuiVideoModel */
  video_model?: string;
  video_model_type?: number;
}

/** 获取歌曲详情响应 */
export interface GetQishuiTrackResponse {
  lyric?: QishuiLyric;
  track?: QishuiTrack;
  track_player?: QishuiTrackPlayer;
  /** 接口结果过期时间（秒级时间戳） */
  expire_at?: number;
  risk_result?: number;
  status_info?: {
    log_id?: string;
    now?: number;
    now_ts_ms?: number;
  };
}
