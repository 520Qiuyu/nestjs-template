import { generateError, generateOk } from '@/common/libs/response';
import type {
  GetSongInfoQueryDto,
  ParseShareLinkQueryDto,
} from '@/qishui/dto/qishui-dto';
import type { QishuiAuthParams } from '@/types/qishui';
import type { MusicInfo } from '@/types/qishui/song';
import { Injectable } from '@nestjs/common';
import { getQishuiSongPlayUrl, getQishuiTrack } from './apis/song';
import { getQishuiImageUrl, parseLink } from './utils';
import { parsePlaylistInfo } from './utils/platlist';
import { krcToLrc, parseMusicInfo } from './utils/song';

/** 临时测试用认证信息，后续改为从认证信息表读取 */
const TEMP_AUTH_INFO: QishuiAuthParams = {
  deviceId: '3819028412917803',
  cookie:
    'passport_csrf_token=81b85bb9e11828881e7aba4cdc88588b; passport_csrf_token_default=81b85bb9e11828881e7aba4cdc88588b; odin_tt=7fba2a2a64ea3837bfcd0195ac919a1538fbdabaeec7fd3ec01ef9b826479eeae2a389b6d0d9e71244f3a1d6cb782e33b758bd686f029a878637cbf55121545eb2321258701082f4b4891575344824e8; passport_assist_user=CjyXag-zVJH1Yd-6PuKxZ_4DT_fTwX3vAJ-VyRz4NDx5Ix1APLapwq7EkCBeASbsBRSaKM8REQ6fRKTI_LcaSgo8AAAAAAAAAAAAAFCOzwWfYEfZJ14qCcBC6tf1yre4fxaUjiwsvuPOZvLy-gxyVs8WzcfXO5EG3IdzFW40EIXBlA4Yia_WVCABIgED1Kjk3Q; n_mh=sFuKj0sIaC8QVIU7KH4eHHqeMtw2gTEQqU3fF8qL2Ok; uid_tt=7d1fe25de0d9dab0027e91b5fb045492; uid_tt_ss=7d1fe25de0d9dab0027e91b5fb045492; sid_tt=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid_ss=4e5c8fc64d8648b4dce66671a8aa26c7; is_staff_user=false; has_biz_token=false; ttwid=1|o8gTDO5GMJURx-KPO4XnN6daBlovoquMFr1nXVK--Ho|1781776547|5bd0095cf07d6ae7a1c904b28053c3821265e0d9c609480814d9e85dfacd0127; sid_guard=4e5c8fc64d8648b4dce66671a8aa26c7|1781776549|5175507|Mon,+17-Aug-2026+07:34:16+GMT; session_tlb_tag=sttt|16|TlyPxk2GSLTc5mZxqKomx_________-n15AT7ZWUosKPK6CMeOfjKTQP6iZzfmJZjrXfBQdYhXw; sid_ucp_v1=1.0.0-KDVjMWU2ZWJkNTExYjU5NDgzMTUyZWExYzdkMzkxODY2MmRiYzAKKQjridmkiwIQpYHP0QYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJobCIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yzc; ssid_ucp_v1=1.0.0-KDVjMWU2ZWJkNTExYjU5NDgzMTUyZWExYzdkMzkxODY2MmRiYzAKKQjridmkiwIQpYHP0QYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJobCIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yc',
  /* xHelios: 'LGMAADr/gVm+3p9k/l3+Io1zICFfcoDyBzKVyrb64I1eEtEM',
  xMedusa:
    'ytc5aj4/ZpAeAOVRH/3xGp4YWHLPHQMB/zfeX0BAIccxmalayjzTrd1JKnZoqkpxPMDb1p6AIvKTesRbU8LYmO1Y/Uc2OJwA176GA03SQNphJCvkhuDiinPQ+ARohFKqlsJH3vFI/Tri5+1bakSkrTsv6tdpWf0mV7EV9dgrzPoHpFCJKLu0vMwscDX9oBbmtHqXE4EgxQb8h83Q0oM06NFvOCG07qL2sw9Kj03fR7VNkrAUeQSpFNTU3KEtWo5n81APU4400rqx/jrHl77bvPxo3KL+F/57kJuUlDUyWpey9HNsZhmLMsEBvEjsA4kCpfx2k3Q2hWTnOheKIAF06OfljCLRizSipWLZWw5m6mroZ3Tkd3g1qdJ22IBBo2boIonVVwXWWax8c8Llt5cHrJXyvEf1kQ4DNJKOG/1Et8Ihcco6r4H7XwC7K8iGofkar+0NEvNl9QeKVNWVHxqvT3pH8xqQNP+6TfTY0KIltzZhhR5ybmEv98N0EV1iawDOee+qbJrh7I7KLpUUpnY6awX6594kTRzcmPVRS1ybBILi4I7hVrRqfpoG8BlS6o39VcZOQij+tNf9NEOqjwpoMQLinOrD3ZCSzB6CPqgZG7xB7yQTvG6VXf0z7zRCPX5kWDnAXoEOZjkPzBVWOgyI0Vtfenp7hyOllx9idHyebYMxTikD/6ruJWe4XK8D3bCmvL5LLhiQ35ya36Ag1+p8OfLMxIxEK5jKQPpjQWIy86Yw978J2ReMOLErFXaIImNiE27r0ynvkYMu6UutP+vXU66ta82fzbVtLP+HmN4WbS5qp6mPdm63pE/lI9UfiQcUuB3Y2JmnycenjtS4b2dlAeSjmGqVkAcoH+X//9+////+/wAA', */
};

@Injectable()
export class QishuiService {
  /**
   * 根据 trackId 获取歌曲完整信息
   * @example
   * ```ts
   * const fullInfo = await this.parseSongInfo('7647155900515649577');
   * ```
   */
  async parseSongInfo(trackId: string): Promise<MusicInfo | null> {
    try {
      // 1、获取歌曲信息
      const trackInfo = await getQishuiTrack(TEMP_AUTH_INFO, { trackId });
      const { lyric, track, track_player } = trackInfo || {};
      const { url_player_info } = track_player || {};
      const musicInfo: MusicInfo = {
        trackId,
        title: trackInfo.track?.name || '未知歌曲',
        artist:
          track?.artists?.map((artist) => artist.name).join(',') || '未知歌手',
        artists:
          track?.artists?.map((artist) => {
            const { id, name, url_avatar } = artist || {};
            return {
              id,
              name,
              avatar: getQishuiImageUrl(url_avatar),
            };
          }) || [],
        album: track?.album?.name || '未知专辑',
        cover: getQishuiImageUrl(track?.album?.url_cover),
        lrc: `[ti:${trackInfo.track?.name}]\n[ar:${track?.artists?.map((artist) => artist.name).join(',')}]\n${krcToLrc(lyric?.content)}`,
        lrcText: krcToLrc(lyric?.content, 'text'),
      };

      if (!url_player_info) {
        console.warn('获取歌曲播放链接失败');
        return musicInfo;
      }

      // 2、获取歌曲播放链接
      try {
        const urls = await getQishuiSongPlayUrl(
          TEMP_AUTH_INFO,
          url_player_info,
        );
        musicInfo.urls = urls;
      } catch (error) {
        console.log('error', error);
      }
      return musicInfo;
    } catch (error) {
      console.error('获取歌曲信息失败:', error);
      return null;
    }
  }

  /** 歌曲分享链接解析 */
  async parseSongShareLink(query: ParseShareLinkQueryDto) {
    const shareUrl = parseLink(query.shareLink);
    const html = await fetch(shareUrl).then((res) => res.text());
    const musicInfo = await parseMusicInfo(html);

    if (!musicInfo.trackId) {
      return generateOk({ shareLink: query.shareLink, musicInfo });
    }

    const fullInfo = await this.parseSongInfo(musicInfo.trackId);
    return generateOk({ shareLink: query.shareLink, musicInfo, fullInfo });
  }

  /** 歌单分享链接解析 */
  async parsePlaylistShareLink(query: ParseShareLinkQueryDto) {
    try {
      const shareUrl = parseLink(query.shareLink);
      const html = await fetch(shareUrl).then((res) => res.text());
      const routerData = await parsePlaylistInfo(html);
      return generateOk({ shareLink: query.shareLink, routerData });
    } catch (error) {
      console.error('解析歌单分享链接失败:', error);
      return generateError(
        error instanceof Error ? error.message : '解析歌单分享链接失败',
      );
    }
  }

  /** 根据歌曲 id 获取歌曲信息 */
  async getSongInfo(query: GetSongInfoQueryDto) {
    const fullInfo = await this.parseSongInfo(query.songId);
    return generateOk({ songId: query.songId, fullInfo });
  }
}
