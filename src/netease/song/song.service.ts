import { AuthManagementService } from '@/authManagement/auth-management.service';
import type { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { generateError, generateOk } from '@/common/libs/response';
import { CardSecretService } from '@/qishui/cardSecret/card-secret.service';
import type { CreateParseLogInput } from '@/qishui/logs/dto/logs.dto';
import { LogsService } from '@/qishui/logs/logs.service';
import type { Response } from '@/types/global';
import { Injectable } from '@nestjs/common';
import {
  lyric,
  song_detail,
  song_download_url_v1,
  song_music_detail,
  type SoundQualityType,
} from '@neteasecloudmusicapienhanced/api';
import type {
  NeteasePrivilege,
  NeteaseSong,
  NeteaseSongDetailData,
  NeteaseSongLyric,
  NeteaseSongQualityData,
  NeteaseSongUrl,
} from '../types';
import { songIdDetailMap } from '../utils/songIdDetailMap';
import type {
  GetNeteaseSongDetailQueryDto,
  GetNeteaseSongDownloadQueryDto,
  GetNeteaseSongQualityQueryDto,
} from './dto/song.dto';

@Injectable()
export class NeteaseSongService {
  constructor(
    private readonly cardSecretService: CardSecretService,
    private readonly logsService: LogsService,
    private readonly authManagementService: AuthManagementService,
  ) {}
  /**
   * 获取歌曲详情
   * @example
   * ```ts
   * const res = await this.getSongDetail({ id });
   * ```
   */
  async getSongDetail(
    {
      id,
      level,
      getDownloadUrl = false,
      cardSecret,
    }: GetNeteaseSongDetailQueryDto,
    meta: RequestMeta,
  ): Promise<Response<NeteaseSongDetailData>> {
    const start = Date.now();
    let parseStatus: CreateParseLogInput['status'] = 'success';
    let errorMsg: string | null = null;
    let targetId = id;
    let authId: string | undefined;
    try {
      // 检查卡密
      const checkSecretMessage =
        await this.cardSecretService.validateSecret(cardSecret);
      if (checkSecretMessage !== true) {
        parseStatus = 'fail';
        errorMsg = checkSecretMessage;
        return generateError(checkSecretMessage);
      }
      // 开始解析
      const quality = (level ?? 'exhigh') as SoundQualityType; // cspell:ignore exhigh
      let cookie: string | undefined;
      let realIP: string | undefined;
      if (getDownloadUrl) {
        const authInfoRes =
          await this.authManagementService.getRandomValidAuthInfo('netease');
        const authData = authInfoRes.data;
        const authCookie = authData?.authInfo.cookies;
        const ip = authData?.authInfo.ip;
        if (!authCookie) {
          parseStatus = 'fail';
          errorMsg = '认证信息无效';
          return generateError('认证信息无效');
        }
        cookie = authCookie as string;
        authId = authData?.id;
        ip && (realIP = ip as string);
      }
      const [detailRes, downloadRes, lyricRes, qualityRes] = await Promise.all([
        song_detail({ ids: id }),
        getDownloadUrl
          ? song_download_url_v1({ id, level: quality, cookie, realIP })
          : null,
        lyric({ id }),
        song_music_detail({ id }),
      ]);
      const { songs = [], privileges = [] } = detailRes?.body ?? {};
      // @ts-ignore
      const { data: downloadData } = downloadRes?.body ?? {};
      const { lrc } = (lyricRes?.body ?? {}) as { lrc?: { lyric?: string } };
      const lrcContent = lrc?.lyric ?? '';
      const lyricPayload: NeteaseSongLyric = {
        lrc: lrcContent,
        lrcText: stripLrcText(lrcContent),
      };
      const { data: qualityData } = qualityRes?.body ?? {};
      const song = songs[0] as NeteaseSong | undefined;
      // 缓存歌曲信息
      if (song) {
        songIdDetailMap.set(song);
      }
      if (authId) {
        this.authManagementService.increaseUseCount(authId);
      }
      // 获取下载链接,记录次数
      if (getDownloadUrl) {
        if (downloadData?.url) {
          parseStatus = 'success';
          errorMsg = null;
          this.cardSecretService.increaseParseCount(cardSecret);
        } else {
          parseStatus = 'fail';
          errorMsg = '获取歌曲下载地址失败';
          this.authManagementService.releaseStickyAuth('netease', authId);
        }
      }
      // 返回结果
      return generateOk({
        detail: {
          song,
          privileges: privileges[0] as NeteasePrivilege | undefined,
        },
        download: (downloadData as NeteaseSongUrl | null | undefined) ?? null,
        lyric: lyricPayload,
        quality: qualityData as NeteaseSongQualityData | null,
      });
    } catch (error) {
      console.log('error', error);
      parseStatus = 'fail';
      errorMsg = error instanceof Error ? error.message : '获取歌曲详情失败';
      return generateError<NeteaseSongDetailData>('获取歌曲详情失败');
    } finally {
      this.logsService.create({
        cardSecret,
        type: 'song',
        platform: 'netease',
        targetName: songIdDetailMap.getLogTarget(id)?.targetName,
        targetId,
        status: parseStatus,
        errorMsg,
        parseParams: { id, level, cardSecret, authId },
        ip: meta.ip,
        path: meta.path,
        method: meta.method,
        ua: meta.userAgent,
        durationMs: Date.now() - start,
      });
    }
  }

  /**
   * 获取歌曲音质详情
   * @example
   * ```ts
   * const res = await this.getSongQuality({ id });
   * ```
   */
  async getSongQuality({
    id,
  }: GetNeteaseSongQualityQueryDto): Promise<Response<NeteaseSongQualityData>> {
    try {
      const res = await song_music_detail({ id });
      const { status, body } = res || {};
      const data = body?.data as NeteaseSongQualityData;
      if (status === 200 && body?.code === 200 && data) {
        return generateOk(data);
      }
      return generateError<NeteaseSongQualityData>(
        (body?.message as string) ||
          (body?.msg as string) ||
          '获取歌曲音质详情失败',
        {
          code: Number(body?.code) || 500,
          data: null,
        },
      );
    } catch (error) {
      return generateError<NeteaseSongQualityData>(
        error instanceof Error ? error.message : '获取歌曲音质详情失败',
      );
    }
  }

  /**
   * 获取歌曲下载地址
   * @example
   * ```ts
   * const res = await this.getSongDownload({ id, level });
   * ```
   */
  async getSongDownload(
    { id, level, cardSecret: cardSecretParam }: GetNeteaseSongDownloadQueryDto,
    meta: RequestMeta,
  ): Promise<Response<NeteaseSongUrl>> {
    const start = Date.now();
    let parseStatus: CreateParseLogInput['status'] = 'success';
    let errorMsg: string | null = null;
    let targetName = songIdDetailMap.getLogTarget(id)?.targetName;
    let targetId = id;
    let authId: string | undefined;
    let realIP: string | undefined;
    try {
      // 校验卡密
      const cardSecret = await this.cardSecretService.validateSecret(
        cardSecretParam,
        {
          checkStatus: true,
          checkExpire: true,
          checkParseLimit: true,
        },
      );
      if (cardSecret !== true) {
        parseStatus = 'fail';
        errorMsg = cardSecret;
        return generateError<NeteaseSongUrl>(cardSecret);
      }

      // 开始解析
      let cookie: string | undefined;
      try {
        const authInfoRes =
          await this.authManagementService.getRandomValidAuthInfo('netease');
        const authData = authInfoRes.data;
        const authCookie = authData?.authInfo.cookies;
        const ip = authData?.authInfo.ip;
        if (!authCookie) {
          parseStatus = 'fail';
          errorMsg = '认证信息无效';
          return generateError('认证信息无效');
        }
        cookie = authCookie as string;
        authId = authData?.id;
        ip && (realIP = ip as string);
      } catch (error) {
        console.log('error', error);
      }
      const quality = (level ?? 'exhigh') as SoundQualityType;
      const res = await song_download_url_v1({
        id,
        level: quality,
        cookie,
        realIP,
      });
      const { status, body } = res || {};
      const data = body?.data as NeteaseSongUrl | undefined;
      if (authId) {
        this.authManagementService.increaseUseCount(authId);
      }
      if (status === 200 && body?.code === 200 && data?.url) {
        // 解析成功，记录使用次数
        await this.cardSecretService.increaseParseCount(cardSecretParam);
        return generateOk(data);
      }
      parseStatus = 'fail';
      errorMsg =
        (body?.message as string) ||
        (body?.msg as string) ||
        '获取歌曲下载地址失败';
      this.authManagementService.releaseStickyAuth('netease', authId);
      return generateError<NeteaseSongUrl>(errorMsg);
    } catch (error) {
      parseStatus = 'fail';
      errorMsg =
        error instanceof Error ? error.message : '获取歌曲下载地址失败';
      this.authManagementService.releaseStickyAuth('netease', authId);
      return generateError<NeteaseSongUrl>(
        error instanceof Error ? error.message : '获取歌曲下载地址失败',
      );
    } finally {
      this.logsService.create({
        cardSecret: cardSecretParam,
        type: 'song',
        platform: 'netease',
        targetName,
        targetId,
        status: parseStatus,
        errorMsg,
        parseParams: { id, level, cardSecret: cardSecretParam, authId },
        ip: meta.ip,
        path: meta.path,
        method: meta.method,
        ua: meta.userAgent,
        durationMs: Date.now() - start,
      });
    }
  }
}

/**
 * 去掉 LRC 时间轴，得到纯文本歌词
 * @example
 * ```ts
 * stripLrcText('[00:12.00]海阔天空'); // '海阔天空'
 * ```
 */
const stripLrcText = (lrc?: string) =>
  (lrc || '')
    .replace(/\[(?:\d+:)?\d+(?:[.:]\d+)?\]/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
