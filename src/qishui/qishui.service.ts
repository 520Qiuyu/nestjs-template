import { generateOk } from '@/common/libs/response';
import type {
  GetPlaylistInfoQueryDto,
  GetSongInfoQueryDto,
  GetSongPlayUrlQueryDto,
  ParseShareLinkQueryDto,
} from '@/qishui/dto/qishui-dto';
import { Injectable } from '@nestjs/common';
import { parseLink, parseRouterData } from './utils';
import { parsePlaylistInfo } from './utils/platlist';
import { parseMusicInfo } from './utils/song';
import { getQishuiTrack } from './apis/song';
import { GetQishuiTrackResponse, QishuiAuthParams } from '@/types/qishui';

@Injectable()
export class QishuiService {
  /** 歌曲分享链接解析 */
  async parseSongShareLink(query: ParseShareLinkQueryDto) {
    const shareUrl = parseLink(query.shareLink);
    const html = await fetch(shareUrl).then((res) => res.text());
    const musicInfo = await parseMusicInfo(html);

    if (!musicInfo.trackId) {
      return generateOk({ shareLink: query.shareLink, musicInfo });
    }

    // 尝试获取完整版链接
    let fullInfo: GetQishuiTrackResponse | null = null;
    try {
      const authInfo: QishuiAuthParams = {
        deviceId: '3819028412917803',
        cookie:
          'passport_csrf_token=81b85bb9e11828881e7aba4cdc88588b; passport_csrf_token_default=81b85bb9e11828881e7aba4cdc88588b; odin_tt=7fba2a2a64ea3837bfcd0195ac919a1538fbdabaeec7fd3ec01ef9b826479eeae2a389b6d0d9e71244f3a1d6cb782e33b758bd686f029a878637cbf55121545eb2321258701082f4b4891575344824e8; passport_assist_user=CjyXag-zVJH1Yd-6PuKxZ_4DT_fTwX3vAJ-VyRz4NDx5Ix1APLapwq7EkCBeASbsBRSaKM8REQ6fRKTI_LcaSgo8AAAAAAAAAAAAAFCOzwWfYEfZJ14qCcBC6tf1yre4fxaUjiwsvuPOZvLy-gxyVs8WzcfXO5EG3IdzFW40EIXBlA4Yia_WVCABIgED1Kjk3Q; n_mh=sFuKj0sIaC8QVIU7KH4eHHqeMtw2gTEQqU3fF8qL2Ok; uid_tt=7d1fe25de0d9dab0027e91b5fb045492; uid_tt_ss=7d1fe25de0d9dab0027e91b5fb045492; sid_tt=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid_ss=4e5c8fc64d8648b4dce66671a8aa26c7; is_staff_user=false; has_biz_token=false; ttwid=1|o8gTDO5GMJURx-KPO4XnN6daBlovoquMFr1nXVK--Ho|1781776547|5bd0095cf07d6ae7a1c904b28053c3821265e0d9c609480814d9e85dfacd0127; sid_guard=4e5c8fc64d8648b4dce66671a8aa26c7|1781776549|5175507|Mon,+17-Aug-2026+07:34:16+GMT; session_tlb_tag=sttt|16|TlyPxk2GSLTc5mZxqKomx_________-n15AT7ZWUosKPK6CMeOfjKTQP6iZzfmJZjrXfBQdYhXw; sid_ucp_v1=1.0.0-KDVjMWU2ZWJkNTExYjU5NDgzMTUyZWExYzdkMzkxODY2MmRiYzAKKQjridmkiwIQpYHP0QYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJobCIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yzc; ssid_ucp_v1=1.0.0-KDVjMWU2ZWJkNTExYjU5NDgzMTUyZWExYzdkMzkxODY2MmRiYzAKKQjridmkiwIQpYHP0QYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJobCIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yc',
        xHelios: 'LGMAADr/gVm+3p9k/l3+Io1zICFfcoDyBzKVyrb64I1eEtEM',
        xMedusa:
          'ytc5aj4/ZpAeAOVRH/3xGp4YWHLPHQMB/zfeX0BAIccxmalayjzTrd1JKnZoqkpxPMDb1p6AIvKTesRbU8LYmO1Y/Uc2OJwA176GA03SQNphJCvkhuDiinPQ+ARohFKqlsJH3vFI/Tri5+1bakSkrTsv6tdpWf0mV7EV9dgrzPoHpFCJKLu0vMwscDX9oBbmtHqXE4EgxQb8h83Q0oM06NFvOCG07qL2sw9Kj03fR7VNkrAUeQSpFNTU3KEtWo5n81APU4400rqx/jrHl77bvPxo3KL+F/57kJuUlDUyWpey9HNsZhmLMsEBvEjsA4kCpfx2k3Q2hWTnOheKIAF06OfljCLRizSipWLZWw5m6mroZ3Tkd3g1qdJ22IBBo2boIonVVwXWWax8c8Llt5cHrJXyvEf1kQ4DNJKOG/1Et8Ihcco6r4H7XwC7K8iGofkar+0NEvNl9QeKVNWVHxqvT3pH8xqQNP+6TfTY0KIltzZhhR5ybmEv98N0EV1iawDOee+qbJrh7I7KLpUUpnY6awX6594kTRzcmPVRS1ybBILi4I7hVrRqfpoG8BlS6o39VcZOQij+tNf9NEOqjwpoMQLinOrD3ZCSzB6CPqgZG7xB7yQTvG6VXf0z7zRCPX5kWDnAXoEOZjkPzBVWOgyI0Vtfenp7hyOllx9idHyebYMxTikD/6ruJWe4XK8D3bCmvL5LLhiQ35ya36Ag1+p8OfLMxIxEK5jKQPpjQWIy86Yw978J2ReMOLErFXaIImNiE27r0ynvkYMu6UutP+vXU66ta82fzbVtLP+HmN4WbS5qp6mPdm63pE/lI9UfiQcUuB3Y2JmnycenjtS4b2dlAeSjmGqVkAcoH+X//9+////+/wAA',
      };
      fullInfo = await getQishuiTrack(authInfo, {
        trackId: musicInfo.trackId,
      });
    } catch (error) {
      console.error('获取完整版链接失败:', error);
    }

    return generateOk({ shareLink: query.shareLink, musicInfo, fullInfo });
  }

  /** 歌单分享链接解析 */
  async parsePlaylistShareLink(query: ParseShareLinkQueryDto) {
    const shareUrl = parseLink(query.shareLink);
    const html = await fetch(shareUrl).then((res) => res.text());
    const routerData = parsePlaylistInfo(html);
    return generateOk({ shareLink: query.shareLink, routerData });
  }

  /** 根据歌曲 id 获取歌曲信息 */
  async getSongInfo(query: GetSongInfoQueryDto) {
    return generateOk({ songId: query.songId });
  }

  /** 根据歌单 id 获取歌单信息 */
  async getPlaylistInfo(query: GetPlaylistInfoQueryDto) {
    return generateOk({ playlistId: query.playlistId });
  }

  /** 获取歌曲播放链接 */
  async getSongPlayUrl(query: GetSongPlayUrlQueryDto) {
    return generateOk({ songId: query.songId });
  }
}
