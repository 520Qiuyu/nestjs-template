import type { KrcLyrics, MusicInfo } from '@/types/qishui/song';
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
 * 解析音乐信息。
 *
 * @example
 * const musicInfo = await parseMusicInfo(html);
 */
export const parseMusicInfo = async (html: string) => {
  if (!html) {
    throw new Error('请传入页面 HTML 内容');
  }

  let musicInfo: MusicInfo = {
    lrcText: '',
  };

  const routerData = parseRouterData(html);
  console.log('routerData', routerData);

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
    musicInfo = {
      trackId: routerData?.loaderData?.track_page?.track_id,
      title,
      artist,
      album,
      cover,
      lrc,
      lrcText: lrcTxt,
      // @ts-ignore
      // routerData,
      urls: [
        {
          url,
          quality: 'audition',
          size: 0,
          format: 'm4a',
          encryptionMethod: '',
          playAuth: '',
          playAuthID: '',
        },
      ],
    };

    // 尝试获取完整版链接
    return musicInfo;
  }

  if (!musicInfo) {
    throw new Error('未找到音乐信息');
  }

  return musicInfo;
};
