import { getAudioFormatFromNetwork, parseRouterData } from '.';
import type { MusicInfo } from '@/types/qishui/song';
import type { KrcLyrics } from '@/types/qishui/song';

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
    let format = 'm4a';
    try {
      const { ext } = await getAudioFormatFromNetwork(url);
      format = ext;
    } catch (error) {
      console.error('获取音频格式失败:', error);
    }
    musicInfo = {
      trackId: routerData?.loaderData?.track_page?.track_id,
      title,
      artist,
      album,
      cover,
      lrc,
      ext: format,
      lrcText: lrcTxt,
      urls: [
        {
          url,
          quality: 'audition',
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
