import type { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { generateError, generateOk } from '@/common/libs/response';
import { Injectable } from '@nestjs/common';
import { NeteasePlaylistService } from '../playlist/playlist.service';
import { NeteaseSongService } from '../song/song.service';
import type {
  NeteaseParseSong,
  NeteaseParseSongData,
  NeteaseParseSongUrl,
  NeteasePlaylist,
  NeteasePlaylistDetail,
  NeteasePlaylistTrackAll,
  NeteasePrivilege,
  NeteaseSong,
  NeteaseSongDetailData,
  NeteaseSongUrl,
} from '../types';
import type {
  ParseNeteaseAlbumQueryDto,
  ParseNeteaseArtistQueryDto,
  ParseNeteasePlaylistQueryDto,
  ParseNeteaseSongQueryDto,
} from './dto/parse.dto';

@Injectable()
export class NeteaseParseService {
  constructor(
    private readonly playlistService: NeteasePlaylistService,
    private readonly songService: NeteaseSongService,
  ) {}

  /**
   * 网易云单曲解析
   * @example
   * ```ts
   * const res = await this.parseSong(query, meta);
   * ```
   */
  async parseSong(_query: ParseNeteaseSongQueryDto, _meta: RequestMeta) {
    // 支持的值
    // id:纯数字
    // 分享链接：https://music.163.com/#/song?id=1456165234
    const { shareLink, cardSecret } = _query;
    // TODO 检查卡密是否正常

    const id = parseNeteaseShareId(shareLink);
    if (!id) {
      return generateError('无效的分享链接，请输入正确的分享链接或id');
    }

    // 获取歌曲详情、歌词
    const detailRes = await this.songService.getSongDetail({
      id,
      getDownloadUrl: false,
    });

    if (detailRes.code !== 200 || !detailRes.data?.detail?.song) {
      return generateError(detailRes.message || '未解析到有效歌曲信息', {
        code: detailRes.code !== 200 ? detailRes.code : 500,
      });
    }

    return generateOk({
      song: pickNeteaseSong(detailRes.data.detail.song),
      // download: pickNeteaseSongUrl(detailRes.data.download),
      lyric: detailRes.data.lyric,
      quality: detailRes.data.quality,
    });
  }

  /**
   * 网易云歌单解析
   * @example
   * ```ts
   * const res = await this.parsePlaylist(query, meta);
   * ```
   */
  async parsePlaylist(
    _query: ParseNeteasePlaylistQueryDto,
    _meta: RequestMeta,
  ) {
    // 支持的值
    // id:纯数字
    // 分享链接：https://music.163.com/#/playlist?id=7044354223
    const { shareLink, cardSecret } = _query;
    // TODO 检查卡密是否正常

    const id = parseNeteaseShareId(shareLink);
    if (!id) {
      return generateError('无效的分享链接，请输入正确的分享链接或id');
    }

    // 获取歌单详情、以及歌曲
    const [detailRes, allRes] = await Promise.all([
      this.playlistService.getPlaylistDetail({ id }),
      this.playlistService.getPlaylistTrackAll({ id }),
    ]);

    // 返回结果（仅保留前端解析页实际使用的字段）
    const isOrigin = true; // 开发调试，返回完整数据
    return generateOk(
      isOrigin
        ? {
            detail: detailRes.data,
            all: allRes.data,
          }
        : pickNeteasePlaylistParseResult(
            detailRes.data as NeteasePlaylistDetail | null,
            allRes.data as NeteasePlaylistTrackAll | null,
          ),
    );
  }

  /**
   * 网易云专辑解析
   * @example
   * ```ts
   * const res = await this.parseAlbum(query, meta);
   * ```
   */
  async parseAlbum(_query: ParseNeteaseAlbumQueryDto, _meta: RequestMeta) {
    return generateOk(null);
  }

  /**
   * 网易云歌手解析
   * @example
   * ```ts
   * const res = await this.parseArtist(query, meta);
   * ```
   */
  async parseArtist(_query: ParseNeteaseArtistQueryDto, _meta: RequestMeta) {
    return generateOk(null);
  }
}

/**
 * 从纯数字或分享链接中拆出网易云资源 id
 * @example
 * ```ts
 * parseNeteaseShareId('7044354223');
 * parseNeteaseShareId('https://music.163.com/#/playlist?id=7044354223');
 * ```
 */
const parseNeteaseShareId = (shareLink: string) => {
  if (/^\d+$/.test(shareLink)) {
    return shareLink;
  }
  const match = shareLink.match(/id=(\d+)/);
  return match?.[1] || '';
};

/**
 * 从网易云歌曲对象中挑出前端展示所需字段
 * @example
 * ```ts
 * const song = pickNeteaseSong(rawSong);
 * ```
 */
const pickNeteaseSong = (song: NeteaseSong): NeteaseParseSong => ({
  id: song.id,
  name: song.name,
  ar: song.ar?.map((item) => ({ id: item.id, name: item.name })) || [],
  al: song.al
    ? { id: song.al.id, name: song.al.name, picUrl: song.al.picUrl }
    : undefined,
  dt: song.dt,
  fee: song.fee,
  noCopyrightRcmd: song.noCopyrightRcmd ?? null,
});

/**
 * 从网易云权限对象中挑出试听判断所需字段
 * @example
 * ```ts
 * const privilege = pickNeteasePrivilege(rawPrivilege);
 * ```
 */
const pickNeteasePrivilege = (privilege: NeteasePrivilege) => ({
  id: privilege.id,
  fee: privilege.fee,
  st: privilege.st,
  pl: privilege.pl,
});

/**
 * 从网易云歌单详情中挑出头部展示所需字段（不含曲目，曲目走 all.songs）
 * @example
 * ```ts
 * const playlist = pickNeteasePlaylist(rawPlaylist);
 * ```
 */
const pickNeteasePlaylist = (playlist: NeteasePlaylist) => ({
  id: playlist.id,
  name: playlist.name,
  coverImgUrl: playlist.coverImgUrl,
  trackCount: playlist.trackCount,
  playCount: playlist.playCount,
  subscribedCount: playlist.subscribedCount,
  description: playlist.description ?? null,
  tags: playlist.tags || [],
  createTime: playlist.createTime,
  creator: playlist.creator
    ? {
        userId: playlist.creator.userId,
        nickname: playlist.creator.nickname,
        avatarUrl: playlist.creator.avatarUrl,
      }
    : undefined,
});

/**
 * 将歌单详情 / 全部歌曲接口裁剪为前端解析页所需结构
 * @example
 * ```ts
 * const data = pickNeteasePlaylistParseResult(detailRes.data, allRes.data);
 * ```
 */
const pickNeteasePlaylistParseResult = (
  detail: NeteasePlaylistDetail | null | undefined,
  all: NeteasePlaylistTrackAll | null | undefined,
) => {
  const playlist = detail?.playlist;
  const songsSource = all?.songs?.length ? all.songs : playlist?.tracks || [];
  const privilegesSource = all?.privileges?.length
    ? all.privileges
    : detail?.privileges || [];

  return {
    detail: playlist
      ? {
          playlist: pickNeteasePlaylist(playlist),
        }
      : null,
    all: {
      songs: songsSource.map(pickNeteaseSong),
      privileges: privilegesSource.map(pickNeteasePrivilege),
    },
  };
};

/**
 * 从下载地址对象中挑出前端音质列表所需字段
 * @example
 * ```ts
 * const url = pickNeteaseSongUrl(rawUrl);
 * ```
 */
const pickNeteaseSongUrl = (
  url: NeteaseSongUrl | null | undefined,
): NeteaseParseSongUrl | null => {
  if (!url) return null;
  return {
    url: url.url,
    size: url.size,
    type: url.type,
    encodeType: url.encodeType,
    level: url.level,
  };
};
