import type { NeteaseSong, NeteaseSongLogInfo } from '../types';

/** 默认最多缓存条数，避免进程内存无限上涨 */
export const SONG_ID_DETAIL_MAP_MAX_SIZE = 5000;

/**
 * 歌曲 id → 精简歌曲信息的内存映射（LRU）。
 * 只缓存写解析日志所需字段（id / 歌名 / 歌手 / 专辑 / 时长 / 收费类型），不含歌词和封面。
 * Map 按插入序排列：get/set 命中时把该项移到末尾，超出 maxSize 时删除最久未访问的头部。
 *
 * 满 2 万条大约 20–40MB 堆内存。
 *
 * @example
 * ```ts
 * songIdDetailMap.set(rawSong);
 * songIdDetailMap.get('347230');
 * songIdDetailMap.getName('347230'); // '海阔天空'
 * songIdDetailMap.getLogTarget('347230'); // { targetId: '347230', targetName: '海阔天空 - Beyond' }
 * ```
 */
export class SongIdDetailMap {
  private readonly store = new Map<string, NeteaseSongLogInfo>();

  constructor(private readonly maxSize = SONG_ID_DETAIL_MAP_MAX_SIZE) {
    if (maxSize < 1) {
      throw new Error('SongIdDetailMap maxSize 必须 ≥ 1');
    }
  }

  /** 当前条数 */
  get size() {
    return this.store.size;
  }

  /** 容量上限 */
  get capacity() {
    return this.maxSize;
  }

  /**
   * 写入或覆盖一条映射；自动精简后缓存，已存在则刷新为最近使用
   * @example
   * songIdDetailMap.set(rawSong)
   */
  set(song: NeteaseSong | NeteaseSongLogInfo) {
    const slim = slimNeteaseSongLogInfo(song);
    const key = this.normalizeId(slim.id);
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, slim);
    this.evictOverflow();
    return this;
  }

  /**
   * 读取精简歌曲信息；命中时刷新 LRU
   * @example
   * const info = songIdDetailMap.get('347230')
   */
  get(id: string | number) {
    const key = this.normalizeId(id);
    const info = this.store.get(key);
    if (!info) return undefined;
    this.store.delete(key);
    this.store.set(key, info);
    return info;
  }

  /**
   * 是否已缓存该 id（不刷新 LRU）
   * @example
   * songIdDetailMap.has('347230')
   */
  has(id: string | number) {
    return this.store.has(this.normalizeId(id));
  }

  /**
   * 取歌曲名；无缓存或无名时返回空字符串
   * @example
   * songIdDetailMap.getName('347230') // '海阔天空'
   */
  getName(id: string | number) {
    return this.peek(id)?.name?.trim() || '';
  }

  /**
   * 取歌手名（多个用顿号拼接）；无缓存时返回空字符串
   * @example
   * songIdDetailMap.getArtistNames('347230') // 'Beyond'
   */
  getArtistNames(id: string | number) {
    const names = this.peek(id)
      ?.ar?.map((item) => item.name?.trim())
      .filter(Boolean);
    return names?.join('、') || '';
  }

  /**
   * 取解析日志用的 targetId / targetName
   * @example
   * songIdDetailMap.getLogTarget('347230')
   * // { targetId: '347230', targetName: '海阔天空 - Beyond' }
   */
  getLogTarget(id: string | number) {
    const info = this.peek(id);
    const name = info?.name?.trim() || '';
    const artists = info?.ar
      ?.map((item) => item.name?.trim())
      .filter(Boolean)
      .join('、');
    return {
      targetId: info ? String(info.id) : this.normalizeId(id),
      targetName: [name, artists].filter(Boolean).join(' - '),
    };
  }

  /**
   * 删除一条映射
   * @example
   * songIdDetailMap.delete('347230')
   */
  delete(id: string | number) {
    return this.store.delete(this.normalizeId(id));
  }

  /** 清空全部映射 */
  clear() {
    this.store.clear();
  }

  /**
   * 只读查看，不刷新 LRU
   * @example
   * songIdDetailMap.peek('347230')
   */
  peek(id: string | number) {
    return this.store.get(this.normalizeId(id));
  }

  private normalizeId(id: string | number) {
    return String(id).trim();
  }

  /** 超出上限时从最久未访问的一端删除 */
  private evictOverflow() {
    while (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}

/**
 * 从完整歌曲对象挑出日志所需字段
 * @example
 * slimNeteaseSongLogInfo(rawSong)
 */
export const slimNeteaseSongLogInfo = (
  song: NeteaseSong | NeteaseSongLogInfo,
): NeteaseSongLogInfo => ({
  id: song.id,
  name: song.name,
  ar: song.ar?.map((item) => ({ id: item.id, name: item.name })) || [],
  al: song.al ? { id: song.al.id, name: song.al.name } : undefined,
  dt: song.dt,
  fee: song.fee,
});

/** 进程内单例，默认最多 2 万条 */
export const songIdDetailMap = new SongIdDetailMap();
