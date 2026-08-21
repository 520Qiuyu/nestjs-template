// import type { MusicInfo } from "../store";

export type QishuiImage = {
  uri?: string;
  urls?: string[];
  template_prefix?: string;
  need_complete_url?: boolean;
  width?: number;
  height?: number;
};

export type PlaylistTrackArtist = {
  name?: string;
};

export type PlaylistTrack = {
  id?: string;
  album?: {
    name?: string;
    url_cover?: QishuiImage;
  };
  artists?: PlaylistTrackArtist[];
  duration?: number; // 歌曲总时长
  preview?: {
    duration?: number; // 歌曲预览时长
  };
  limited_free_info?: Record<string, unknown> | null;
  name?: string;
  stats?: {
    count_collected?: number;
    count_comment?: number;
    count_shared?: number;
  };
};

/** 歌单视频艺人 */
export type PlaylistVideoArtist = {
  id?: string;
  name?: string;
  url_avatar?: QishuiImage;
  count_tracks?: number;
  state?: {
    blocked_by_me?: boolean;
  };
  user_info?: {
    id?: string;
    nickname?: string;
    medium_avatar_url?: QishuiImage;
    thumb_avatar_url?: QishuiImage;
    artist_id?: string;
    secret?: boolean;
    test_tag?: number;
    vip_stage?: string;
    is_vip?: boolean;
    is_luna_user?: boolean;
  };
  simple_display_name?: string;
  user_artist_type?: number;
};

/** 歌单视频标签 */
export type PlaylistVideoTag = {
  name?: string;
  id?: number;
  level?: number;
};

/** 歌单内视频实体（ugc_video 等） */
export type PlaylistVideo = {
  description?: string;
  duration?: number;
  image_url?: QishuiImage;
  vid?: string;
  video_id?: string;
  width?: number;
  height?: number;
  stats?: {
    count_collected?: number;
    count_comment?: number;
    count_shared?: number;
    count_marked?: number;
  };
  type?: string;
  title?: string;
  share_cover_url?: QishuiImage;
  video_tags?: PlaylistVideoTag[];
  cover_url?: QishuiImage;
  state?: Record<string, unknown>;
  volume_info?: {
    loudness?: number;
    peak?: number;
  };
  artists?: PlaylistVideoArtist[];
  label_info?: {
    background_play?: boolean;
    background_queue_skip?: boolean;
    display_video_inflow?: boolean;
  };
  colors?: Record<string, unknown>;
  support_dash?: boolean;
  aweme_type?: number;
  warn_info?: {
    type?: number;
    sub_type?: number;
    title?: string;
    content?: string;
    icon_url?: QishuiImage;
  };
  nodes?: Array<{
    type?: number;
    start?: number;
    duration?: number;
    priority?: number;
    opacity?: number;
  }>;
  landscape_background_url?: QishuiImage;
  check_context?: string;
  video_type?: string[];
};

export type PlaylistMedia = {
  id?: string;
  type?: string;
  entity?: {
    track?: PlaylistTrack;
    video?: PlaylistVideo;
    /** PC 歌单详情接口：歌曲包在 track_wrapper 内 */
    track_wrapper?: {
      track?: PlaylistTrack;
    };
    /** PC 歌单详情接口：视频包在 video_wrapper 内 */
    video_wrapper?: {
      video?: PlaylistVideo;
    };
  };
};

export type RawPlaylistInfo = {
  id?: string;
  title?: string;
  public_title?: string;
  url_cover?: QishuiImage;
  count_tracks?: number;
  resource_cnt?: {
    track_cnt?: number;
  };
  owner?: {
    nickname?: string;
    public_name?: string;
  };
};

/** 获取歌单详情请求参数 */
export type GetQishuiPlaylistDetailParams = {
  playlistId: string;
  cursor?: string;
  count?: number;
};

/** 汽水 PC 端歌单详情响应 */
export type GetQishuiPlaylistDetailResponse = {
  status_info?: {
    log_id?: string;
    now?: number;
    now_ts_ms?: number;
  };
  has_more?: boolean;
  next_cursor?: string;
  playlist?: RawPlaylistInfo;
  media_resources?: PlaylistMedia[];
  session_id?: string;
};

export type PlaylistPageData = {
  medias?: PlaylistMedia[];
  playlistInfo?: RawPlaylistInfo;
};

/** 专辑分享页 loader 数据 */
export type AlbumPageData = {
  trackList?: PlaylistTrack[];
  albumInfo?: {
    id?: string;
    name?: string;
    artists?: PlaylistTrackArtist[];
    count_tracks?: number;
    url_cover?: QishuiImage;
  };
};

export type PlaylistMusicInfo = /* MusicInfo &  */ {
  id?: string;
  type?: 'video' | 'track';
  duration?: number;
  previewDuration?: number;
  isPreviewOnly?: boolean;
  collectCount?: number;
  commentCount?: number;
  shareCount?: number;
};

export type PlaylistInfo = {
  id?: string;
  title: string;
  cover: string;
  owner: string;
  countTracks: number;
  tracks: PlaylistMusicInfo[];
  /** 分享页来源：歌单 / 专辑 */
  source?: 'playlist' | 'album';
};
