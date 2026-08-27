import type { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { generateError, generateOk } from '@/common/libs/response';
import { Injectable } from '@nestjs/common';
import { NeteasePlaylistService } from '../playlist/playlist.service';
import type {
  ParseNeteaseAlbumQueryDto,
  ParseNeteaseArtistQueryDto,
  ParseNeteasePlaylistQueryDto,
  ParseNeteaseSongQueryDto,
} from './dto/parse.dto';

@Injectable()
export class NeteaseParseService {
  constructor(private readonly playlistService: NeteasePlaylistService) {}

  /**
   * 网易云单曲解析
   * @example
   * ```ts
   * const res = await this.parseSong(query, meta);
   * ```
   */
  async parseSong(_query: ParseNeteaseSongQueryDto, _meta: RequestMeta) {
    return generateOk(null);
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

    // 拆解id
    let id = '';
    if (/^\d+$/.test(shareLink)) {
      id = shareLink;
    } else if (/id=(\d+)/.test(shareLink)) {
      const match = shareLink.match(/id=(\d+)/);
      if (match) {
        id = match[1];
      }
    }
    if (!id) {
      return generateError('无效的分享链接，请输入正确的分享链接或id');
    }

    // 获取歌单详情、以及歌曲
    const [detailRes, allRes] = await Promise.all([
      this.playlistService.getPlaylistDetail({ id }),
      this.playlistService.getPlaylistTrackAll({ id }),
    ]);

    // 返回结果
    return generateOk({
      detail: detailRes.data,
      all: allRes.data,
    });
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
