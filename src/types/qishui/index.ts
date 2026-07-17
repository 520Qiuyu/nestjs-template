import { PlaylistPageData } from './platlist';
import { TrackPageData } from './song';

/** 汽水接口认证参数 */
export interface QishuiAuthParams {
  /** 设备 ID */
  deviceId: string;
  /** Cookie */
  cookie: string;
  /** x-helios */
  xHelios?: string;
  /** x-medusa */
  xMedusa?: string;
  /** x-argus，每次请求动态签名（可选） */
  xArgus?: string;
  /** x-gorgon，每次请求动态签名（可选） */
  xGorgon?: string;
  /** x-ladon，每次请求动态签名（可选） */
  xLadon?: string;
  /** x-khronos，请求时间戳（可选） */
  xKhronos?: string;
  /** x-ss-stub，请求体 MD5（可选） */
  xSsStub?: string;
  /** x-tt-trace-id，链路追踪 ID（可选） */
  xTtTraceId?: string;
}

/** 汽水公共请求可选覆盖参数 */
export interface QishuiRequestOptions {
  /** install id，默认 1167017294437932 */
  iid?: string;
  /** fingerprint，默认与 deviceId 相同 */
  fp?: string;
  /** 版本名 */
  versionName?: string;
  /** 版本号 */
  versionCode?: string;
  /** User-Agent */
  userAgent?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/** 获取汽水用户信息可选覆盖参数 */
export type GetQishuiUserInfoOptions = QishuiRequestOptions;

/** 获取歌曲详情请求体 */
export interface GetQishuiTrackParams {
  /** 歌曲 ID */
  trackId: string;
  /** 媒体类型，默认 track */
  mediaType?: string;
  /** 队列类型，默认 self_playlist */
  queueType?: string;
  /** 场景名，默认 library */
  sceneName?: string;
}

/** 获取歌曲详情可选覆盖参数 */
export type GetQishuiTrackOptions = QishuiRequestOptions;

/** 构建汽水请求头时的扩展选项 */
export interface BuildQishuiHeadersOptions extends QishuiRequestOptions {
  contentType?: string;
}

export type RouterData = {
  loaderData?: {
    track_page?: TrackPageData;
    playlist_page?: PlaylistPageData;
  };
};

export type {
  GetQishuiPlayInfoResponse,
  GetQishuiTrackResponse,
  QISHUI_AUDIO_QUALITY_MAP,
  QishuiAlbum,
  QishuiArtist,
  QishuiAudioQuality,
  QishuiBitRate,
  QishuiImage,
  QishuiLyric,
  QishuiPlayInfoData,
  QishuiPlayInfoItem,
  QishuiPlayVideoItem,
  QishuiTrack,
  QishuiTrackPlayer,
  QishuiVideoModel,
} from './track';
