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

const tempCookie = [
  'MUSIC_R_T=1537619577425; MUSIC_A_T=1537618673356; _ntes_nnid=c6468d2ccd409b38a0ad45a09e311966,1781599693402; _ntes_nuid=c6468d2ccd409b38a0ad45a09e311966; NMTID=00Oja1Hp8Dld-PkK0iqm9T123Z9QMgAAAGez53r1A; WEVNSM=1.0.0; WNMCID=anzvns.1781599697352.01.0; sDeviceId=YD-JEJXh2FV5zVEEgURUUPToUPhnrztCaxX; ntes_kaola_ad=1; _iuqxldmzr_=32; __remember_me=true; Hm_lvt_1483fb4774c02a30ffa6f0e2945e9b70=1785814374,1787119960,1787125961,1787715468; HMACCOUNT=7D8A8E5E6AAA7316; MUSIC_U=0057BA4AEE6685345CF41767AE8CF7CEE6FEC2DC142CA699DD3DF2FBF5C07D2571079761E3DD9518E96C2D2A452BBBB3B3BA0A929054C5199DA0BEE9E9FAAB44C2BF0CBE08EB5933C62FEC669DEAE9139DC53EFF1F48BB34A22282747BD3760385E48B41B5C65350B7F5CA403B7C011900D950308C7F628A14D804F1E5B871AF2944391BA7BAEDF416341A9563D859722910674ACCD81530922B48552E9C44B2EC7FB8519DB1C7F6ED20EE74AC42DAFCF0A51E37BADB52797B6352CCA5C934D90ECA218486DF80772793D6F67B146C7C36DAFC8E92342BFC0EDEFBF470EA7DD5536992A0BE6C89D27E64B371487A8E5550E1549FDFD8FFA01D3D90FE568F748543CCDAC8F18A32ADC7B1D10AEC2BFD3037F191A4F67E34D1F9B8B8A8FD3976518C0814E8F0BB022FBFB5D05EA7F316C088D47F0949573528829101A85A9EFFF0976D989918D41756E209E2F292862DB5E85E5E6F94D370B48230FCB51553F51B1763C8E1B810B216407BDF55FA954021C1A9F6402E53E6419F94249B70D2B09895A289B7C17F077B01CF31CBB453EAEA01; __csrf=757575be8deedc5463bcfd819dca289d; JSESSIONID-WYYY=%2BQZH9zWb%2BCf8YqWJiBsdEZR9OI1%5CpgZWHeNF9FHXyVHHtwSsREHYzyUfKAA4kDWUOEY3I7obcDK6nozwRUW2%2BXvHEvUMrNovJkYaJXQIE8%5C9nfvzd8MF5DnVWBG1MHWbB9sR%2BaTG3A424I%2F2K4JQZbNJmvTT5ctb%2FUSIHYdhMkOJ4%2B2c%3A1787892285663; Hm_lpvt_1483fb4774c02a30ffa6f0e2945e9b70=1787891295',
];

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
      if (getDownloadUrl) {
        const authInfo: any =
          await this.authManagementService.getRandomValidAuthInfo('netease');
        if (!authInfo) {
          parseStatus = 'fail';
          errorMsg = '认证信息无效';
          return generateError('认证信息无效');
        }
        cookie = authInfo.authInfo.cookie;
      }
      const [detailRes, downloadRes, lyricRes, qualityRes] = await Promise.all([
        song_detail({ ids: id }),
        getDownloadUrl
          ? song_download_url_v1({ id, level: quality, cookie })
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
      // 获取下载链接,记录次数
      if (getDownloadUrl && downloadData?.url) {
        this.cardSecretService.increaseParseCount(cardSecret).then(() => {
          this.logsService.create({
            cardSecret,
            type: 'song',
            platform: 'netease',
            targetName: songIdDetailMap.getLogTarget(id)?.targetName,
            targetId,
            status: parseStatus,
            errorMsg,
            parseParams: { id, level, cardSecret },
            ip: meta.ip,
            path: meta.path,
            method: meta.method,
            ua: meta.userAgent,
            durationMs: Date.now() - start,
          });
        });
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
      parseStatus = 'fail';
      errorMsg = error instanceof Error ? error.message : '获取歌曲详情失败';
      return generateError<NeteaseSongDetailData>('获取歌曲详情失败');
    } finally {
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
      const cookie = tempCookie[0];
      const quality = (level ?? 'exhigh') as SoundQualityType;
      const res = await song_download_url_v1({ id, level: quality, cookie });
      const { status, body } = res || {};
      const data = body?.data as NeteaseSongUrl | undefined;
      if (status === 200 && body?.code === 200 && data) {
        // 解析成功，记录使用次数
        await this.cardSecretService.increaseParseCount(cardSecretParam);
        return generateOk(data);
      }
      parseStatus = 'fail';
      errorMsg =
        (body?.message as string) ||
        (body?.msg as string) ||
        '获取歌曲下载地址失败';
      return generateError<NeteaseSongUrl>(errorMsg);
    } catch (error) {
      parseStatus = 'fail';
      errorMsg =
        error instanceof Error ? error.message : '获取歌曲下载地址失败';
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
        parseParams: { id, level, cardSecret: cardSecretParam },
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
