import { generateError, generateOk } from '@/common/libs/response';
import type { Response } from '@/types/global';
import { Injectable } from '@nestjs/common';
import { album } from '@neteasecloudmusicapienhanced/api';
import type {
  NeteaseAlbumDetail,
  NeteaseAlbumInfo,
  NeteaseAlbumSongPrivilege,
  NeteaseParseSong,
  NeteasePrivilege,
  NeteaseSong,
} from '../types';
import type { GetNeteaseAlbumDetailQueryDto } from './dto/album.dto';

type RawAlbumSong = NeteaseSong & { privilege?: NeteasePrivilege };

@Injectable()
export class NeteaseAlbumService {
  /**
   * 获取专辑详情（含曲目列表，已裁剪）
   * @example
   * ```ts
   * const res = await this.getAlbumDetail({ id: '32311' });
   * ```
   */
  async getAlbumDetail(
    query: GetNeteaseAlbumDetailQueryDto,
  ): Promise<Response<NeteaseAlbumDetail>> {
    try {
      const res = await album({ id: query.id });
      const { status, body } = res || {};
      if (status === 200 && body?.code === 200 && body.album) {
        const songs = (body.songs as RawAlbumSong[]) || [];
        return generateOk({
          album: pickAlbum(body.album as NeteaseAlbumInfo),
          songs: songs.map(pickAlbumSong),
          privileges: songs
            .map((item) => pickAlbumPrivilege(item.privilege))
            .filter((item): item is NeteaseAlbumSongPrivilege => Boolean(item)),
        });
      }
      return generateError<NeteaseAlbumDetail>(
        (body?.message as string) ||
          (body?.msg as string) ||
          '获取专辑详情失败',
        {
          code: Number(body?.code) || 500,
          data: null,
        },
      );
    } catch (error) {
      return generateError<NeteaseAlbumDetail>(
        error instanceof Error ? error.message : '获取专辑详情失败',
      );
    }
  }
}

/**
 * 裁剪专辑主体
 * @example
 * pickAlbum(rawAlbum)
 */
const pickAlbum = (raw: NeteaseAlbumInfo): NeteaseAlbumInfo => ({
  id: raw.id,
  name: raw.name,
  picUrl: raw.picUrl,
  publishTime: raw.publishTime,
  company: raw.company ?? null,
  description: raw.description ?? null,
  size: raw.size,
  type: raw.type,
  subType: raw.subType,
  alias: raw.alias || [],
  artist: raw.artist
    ? {
        id: raw.artist.id,
        name: raw.artist.name,
        picUrl: raw.artist.picUrl || undefined,
      }
    : { id: 0, name: '' },
});

/**
 * 裁剪专辑曲目
 * @example
 * pickAlbumSong(rawSong)
 */
const pickAlbumSong = (song: NeteaseSong): NeteaseParseSong => ({
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
 * 裁剪曲目权限
 * @example
 * pickAlbumPrivilege(rawPrivilege)
 */
const pickAlbumPrivilege = (
  privilege?: NeteasePrivilege,
): NeteaseAlbumSongPrivilege | undefined => {
  if (!privilege) return undefined;
  return {
    id: privilege.id,
    fee: privilege.fee,
    st: privilege.st,
    pl: privilege.pl,
  };
};
