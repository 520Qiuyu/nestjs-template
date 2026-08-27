import { generateError, generateOk } from '@/common/libs/response';
import { Injectable } from '@nestjs/common';
import {
  playlist_detail,
  playlist_track_all,
} from '@neteasecloudmusicapienhanced/api';
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
  async getPlaylistDetail(query: GetNeteasePlaylistDetailQueryDto) {
    try {
      const res = await playlist_detail({ id: query.id });
      const { status, body } = res || {};
      if (status === 200 && body?.code === 200) {
        return generateOk(body);
      }
      return generateError((body?.message as string) || '获取歌单详情失败', {
        code: Number(body?.code) || 500,
        data: null,
      });
    } catch (error) {
      return generateError(
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
  async getPlaylistTrackAll(query: GetNeteasePlaylistTrackAllQueryDto) {
    try {
      const { id, limit, offset } = query;
      if (limit) {
        return this.fetchTrackPage(id, {
          limit,
          offset: offset ?? 0,
        });
      }

      const songs: unknown[] = [];
      const privileges: unknown[] = [];
      let firstBody: Record<string, unknown> | null = null;

      for (let page = 0; page < TRACK_MAX_PAGES; page += 1) {
        const offset = page * TRACK_PAGE_SIZE;
        const res = await playlist_track_all({
          id: query.id,
          limit: TRACK_PAGE_SIZE,
          offset,
        });
        if (res.body?.code !== 200) {
          if (!firstBody) {
            return generateError(
              (res.body?.msg as string) || '获取歌单歌曲失败',
              { code: Number(res.body?.code) || 500, data: res.body },
            );
          }
          break;
        }
        if (!firstBody) firstBody = res.body;
        const pageSongs = (res.body.songs as unknown[]) || [];
        const pagePrivileges = (res.body.privileges as unknown[]) || [];
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
      });
    } catch (error) {
      return generateError(
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
  ) {
    const res = await playlist_track_all({
      id,
      limit: page.limit,
      offset: page.offset,
    });
    if (res.body?.code !== 200) {
      return generateError((res.body?.msg as string) || '获取歌单歌曲失败', {
        code: Number(res.body?.code) || 500,
        data: res.body,
      });
    }
    return generateOk(res.body);
  }
}
