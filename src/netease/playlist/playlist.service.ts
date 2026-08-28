import { generateError, generateOk } from '@/common/libs/response';
import type { Response } from '@/types/global';
import { Injectable } from '@nestjs/common';
import {
  playlist_detail,
  playlist_track_all,
} from '@neteasecloudmusicapienhanced/api';
import type {
  NeteasePlaylistDetail,
  NeteasePlaylistTrackAll,
  NeteasePrivilege,
  NeteaseSong,
} from '../types';
import type {
  GetNeteasePlaylistDetailQueryDto,
  GetNeteasePlaylistTrackAllQueryDto,
} from './dto/playlist.dto';

const TRACK_PAGE_SIZE = 1000;
const TRACK_MAX_PAGES = 50;

@Injectable()
export class NeteasePlaylistService {
  /**
   * 获取歌单详情
   * @example
   * ```ts
   * const res = await this.getPlaylistDetail({ id: '7044354223' });
   * ```
   */
  async getPlaylistDetail(
    query: GetNeteasePlaylistDetailQueryDto,
  ): Promise<Response<NeteasePlaylistDetail>> {
    try {
      const res = await playlist_detail({ id: query.id });
      const { status, body } = res || {};
      if (status === 200 && body?.code === 200) {
        return generateOk(body as unknown as NeteasePlaylistDetail);
      }
      return generateError<NeteasePlaylistDetail>(
        (body?.message as string) || '获取歌单详情失败',
        {
          code: Number(body?.code) || 500,
          data: null,
        },
      );
    } catch (error) {
      return generateError<NeteasePlaylistDetail>(
        error instanceof Error ? error.message : '获取歌单详情失败',
      );
    }
  }

  /**
   * 获取歌单所有歌曲。未传 limit 时自动翻页拉全量；传入 limit 则按分页返回。
   * @example
   * ```ts
   * const all = await this.getPlaylistTrackAll({ id: '7044354223' });
   * const page = await this.getPlaylistTrackAll({ id: '7044354223', limit: 50, offset: 0 });
   * ```
   */
  async getPlaylistTrackAll(
    query: GetNeteasePlaylistTrackAllQueryDto,
  ): Promise<Response<NeteasePlaylistTrackAll>> {
    try {
      const { id, limit, offset } = query;
      if (limit) {
        return this.fetchTrackPage(id, {
          limit,
          offset: offset ?? 0,
        });
      }

      const songs: NeteaseSong[] = [];
      const privileges: NeteasePrivilege[] = [];
      let firstBody: NeteasePlaylistTrackAll | null = null;

      for (let page = 0; page < TRACK_MAX_PAGES; page += 1) {
        const offset = page * TRACK_PAGE_SIZE;
        const res = await playlist_track_all({
          id: query.id,
          limit: TRACK_PAGE_SIZE,
          offset,
        });
        if (res.body?.code !== 200) {
          if (!firstBody) {
            return generateError<NeteasePlaylistTrackAll>(
              (res.body?.msg as string) || '获取歌单歌曲失败',
              {
                code: Number(res.body?.code) || 500,
                data: res.body as unknown as NeteasePlaylistTrackAll,
              },
            );
          }
          break;
        }
        if (!firstBody) firstBody = res.body as unknown as NeteasePlaylistTrackAll;
        const pageSongs = (res.body.songs as NeteaseSong[]) || [];
        const pagePrivileges = (res.body.privileges as NeteasePrivilege[]) || [];
        songs.push(...pageSongs);
        privileges.push(...pagePrivileges);
        if (pageSongs.length < TRACK_PAGE_SIZE) {
          break;
        }
      }

      return generateOk({
        ...firstBody,
        songs,
        privileges,
      } as NeteasePlaylistTrackAll);
    } catch (error) {
      return generateError<NeteasePlaylistTrackAll>(
        error instanceof Error ? error.message : '获取歌单歌曲失败',
      );
    }
  }

  /**
   * 按分页拉取歌单歌曲
   * @example
   * ```ts
   * const res = await this.fetchTrackPage('7044354223', { limit: 50, offset: 0 });
   * ```
   */
  private async fetchTrackPage(
    id: string,
    page: { limit: number; offset: number },
  ): Promise<Response<NeteasePlaylistTrackAll>> {
    const res = await playlist_track_all({
      id,
      limit: page.limit,
      offset: page.offset,
    });
    if (res.body?.code !== 200) {
      return generateError<NeteasePlaylistTrackAll>(
        (res.body?.msg as string) || '获取歌单歌曲失败',
        {
          code: Number(res.body?.code) || 500,
          data: res.body as unknown as NeteasePlaylistTrackAll,
        },
      );
    }
    return generateOk(res.body as unknown as NeteasePlaylistTrackAll);
  }
}
