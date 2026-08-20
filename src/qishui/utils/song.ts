import type { KrcLyrics, MusicInfo, UgcVideoPageData } from '@/types/qishui/song';
import { parseRouterData } from '.';

/**
 * 将毫秒时间格式化为标准 LRC 时间戳
 * @example
 * ```ts
 * formatLrcTime(14730) // '00:14.73'
 * ```
 */
const formatLrcTime = (timeMs: number) => {
  const normalizedTimeMs = Number.isFinite(timeMs) ? Math.max(timeMs, 0) : 0;
  const minutes = Math.floor(normalizedTimeMs / 60000);
  const seconds = Math.floor((normalizedTimeMs % 60000) / 1000);
  const centiseconds = Math.floor((normalizedTimeMs % 1000) / 10);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    centiseconds,
  ).padStart(2, '0')}`;
};

/**
 * 将汽水音乐返回的 krc 歌词结构转换为标准 lrc 文本。
 *
 * @example
 * const lrc = parseLrc({
 *   lyricType: "krc",
 *   sentences: [{ text: "一点", startMs: 1200, endMs: 2500, words: [] }],
 * });
 */
export const parseLrc = (
  lyrics?: KrcLyrics | null,
  type: 'lrc' | 'txt' = 'lrc',
) => {
  if (!lyrics?.sentences?.length) {
    return '';
  }

  const isLrc = type === 'lrc';

  return lyrics.sentences
    .filter((sentence) => sentence.text)
    .map((sentence) =>
      isLrc
        ? `[${formatLrcTime(sentence.startMs)}]${sentence.text}`
        : `${sentence.text}`,
    )
    .join('\n');
};

/**
 * 将汽水 KRC 歌词正文转为标准 LRC / 纯文本
 * @param content KRC 歌词原文
 * @param type `lrc` 带时间戳，`text` 仅歌词文本，默认 `lrc`
 * @example
 * ```ts
 * krcToLrc('[14730,6290]<0,370,0>想<400,350,0>去')
 * // => '[00:14.73]想去'
 *
 * krcToLrc('[14730,6290]<0,370,0>想<400,350,0>去', 'text')
 * // => '想去'
 * ```
 */
export const krcToLrc = (
  content?: string | null,
  type: 'lrc' | 'text' = 'lrc',
) => {
  if (!content?.trim()) {
    return '';
  }

  const isLrc = type === 'lrc';

  return content
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\[(\d+),\d+\](.*)$/);
      if (!match) {
        const text = line.replace(/<\d+,\d+,\d+>/g, '').trim();
        return text;
      }

      const startMs = Number(match[1]);
      const text = match[2].replace(/<\d+,\d+,\d+>/g, '').trim();
      if (!text) {
        return '';
      }

      return isLrc ? `[${formatLrcTime(startMs)}]${text}` : text;
    })
    .filter(Boolean)
    .join('\n');
};

/**
 * 将 ugc 视频分享页数据转为 MusicInfo。
 *
 * @example
 * const info = formatUgcVideoMusicInfo(routerData.loaderData.ugc_video_page);
 */
export const formatUgcVideoMusicInfo = (
  page?: UgcVideoPageData | null,
): MusicInfo | null => {
  const options = page?.videoOptions;
  if (!page || !options) {
    return null;
  }

  const title = options.videoName || '未知歌曲';
  const artist = options.artistName || '未知歌手';
  const playUrl = options.url ? encodeURI(decodeURI(options.url)) : '';

  return {
    type: 'video',
    trackId: page.video_id || options.video_id,
    title,
    artist,
    artists: artist
      ? [
          {
            id: '',
            name: artist,
            avatar: options.artistThumbAvatarArr?.[0],
          },
        ]
      : [],
    album: '未知专辑',
    cover:
      options.coverURL ||
      options.metaURL ||
      options.firstFrameURL ||
      'https://via.placeholder.com/120',
    lrcText: '',
    urls: playUrl
      ? [
          {
            url: playUrl,
            quality: 'medium',
            size: 0,
            format: 'mp4',
            codec: 'h264',
            encryptionMethod: '',
            playAuth: '',
            playAuthID: '',
          },
        ]
      : [],
  };
};

/**
 * 解析音乐信息（歌曲分享页或 ugc 视频分享页）。
 *
 * @example
 * const musicInfo = await parseMusicInfo(html);
 */
export const parseMusicInfo = async (html: string) => {
  if (!html) {
    throw new Error('请传入页面 HTML 内容');
  }

  const routerData = parseRouterData(html);

  // 音频
  const audioWithLyricsOption =
    routerData?.loaderData?.track_page?.audioWithLyricsOption;
  if (audioWithLyricsOption) {
    const title = audioWithLyricsOption.trackName || '未知歌曲';
    const artist = audioWithLyricsOption.artistName || '未知歌手';
    const album = audioWithLyricsOption.trackInfo?.album?.name || '未知专辑';
    const cover =
      audioWithLyricsOption.coverURL || 'https://via.placeholder.com/120';
    const url = audioWithLyricsOption.url
      ? encodeURI(decodeURI(audioWithLyricsOption.url))
      : '';
    const lrc = `[ti:${title}]\n[ar:${artist}]\n${parseLrc(audioWithLyricsOption.lyrics)}`;
    const lrcTxt = parseLrc(audioWithLyricsOption.lyrics, 'txt');

    return {
      type: 'track',
      trackId: routerData?.loaderData?.track_page?.track_id,
      title,
      artist,
      album,
      cover,
      lrc,
      lrcText: lrcTxt,
      urls: [
        {
          url,
          quality: 'audition',
          size: 0,
          format: 'm4a',
          codec: 'aac',
          encryptionMethod: '',
          playAuth: '',
          playAuthID: '',
        },
      ],
    } satisfies MusicInfo;
  }

  // 视频
  const videoInfo = formatUgcVideoMusicInfo(
    routerData?.loaderData?.ugc_video_page,
  );
  if (videoInfo) {
    return videoInfo;
  }

  throw new Error('未找到音乐信息');
};
