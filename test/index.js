import axios from 'axios';

var options = {
  method: 'POST',
  url: 'https://api.qishui.com/luna/pc/track_v2',
  params: {
    aid: '386088',
    app_name: 'luna_pc',
    region: 'cn',
    geo_region: 'cn',
    os_region: 'cn',
    sim_region: '',
    device_id: '3819028412917803',
    cdid: '',
    iid: '1958661630215212',
    version_name: '3.5.2',
    version_code: '30050200',
    channel: 'ug',
    build_mode: 'master',
    network_carrier: '',
    ac: 'wifi',
    tz_name: 'Asia/Shanghai',
    resolution: '',
    device_platform: 'windows',
    device_type: 'Windows',
    os_version: 'Windows 11 Pro',
    fp: '3819028412917803'
  },
  headers: {
    'User-Agent': 'LunaPC/3.5.2(412998333)',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
    'x-helios': 'nUAAAEcFdo2g9IrcI+KrICOKjyWY+SKAIG1EQnoeUyqhPk6R',
    'x-medusa': 'bZpZaplyBpC5TYVRuLCRGjlVOHKECgMBmTZtBWCAEZA3GepL1jgJnVMqRVKM+7K2aHRyVUTSWN5sG25n5BjUWUhuUo6DWSX4IvbHUBJ23Z285SyrpCyjLwfdloaoW4rOQ92k19XeQFJljQbr8yHyGaEJPYV6siAbaQ8W46MadAH7vyMoseYE2D8f/TQ1xslExl0j/sobm3VFVVzb+O15YxoqMCvVPUPxxwFeDetbrWxAcLeLqVsfUX8bBnwGHtZvycak+nmRJXdBub3nhLMNUp9TEWZnIcGRtPTui7EN7/cXuWnmSxb/jrZphAttY4RLVZgXlE2ZSqcdIXUJsdoyMKBUItCAqEfRfC2UJR0uCaW6xsrbqKaCRbVZQdMbmojloIfgt0Brc7SbHfeOOQ4VNA7NIt59Nvj4fifAnia8k1ALDThYMIAak2n6zW32fzpQVCVJzHjMoRqhVBPY9cE5uSz6M3XI0Ibkm8VbpsM9612hc+zmhS85swOLkXUTrIZkbHIFmdSXSTQQxY8mVg1A9LKcoYxjBHJ5q2mAG/dPvbFrXPL2vvZBCFtPI4Edb2fmX+weiBq0RykwZpZoMSBEN2LRupmurPT1236VM/yTwWZ7oprIkVoWXOtvw95Kq3dqt2MC0el/QsFlY3+tKVapHlTiHiLzVZaTSNaX6nmyd0+/Z4w04b43KlDQY2u/tyqcgcfCV+AFU9kcQ05GUo+z7g4LEEiEhJUuHjH7b6+frx9cD78L2VecMLGrFXSoInNiEm7r0SmvgYsv6UvI3AGdxU50b8+fzaVtLH+Hmv4WfSZqp62Pdm6nrE9lJ9U/yQccuJ26ErXH6Rc3LtS4bydlAeUjmGqV0BcoHmX/////7//+/wAA',
    Cookie: 'passport_csrf_token=81b85bb9e11828881e7aba4cdc88588b; passport_csrf_token_default=81b85bb9e11828881e7aba4cdc88588b; odin_tt=7fba2a2a64ea3837bfcd0195ac919a1538fbdabaeec7fd3ec01ef9b826479eeae2a389b6d0d9e71244f3a1d6cb782e33b758bd686f029a878637cbf55121545eb2321258701082f4b4891575344824e8; passport_assist_user=CjyXag-zVJH1Yd-6PuKxZ_4DT_fTwX3vAJ-VyRz4NDx5Ix1APLapwq7EkCBeASbsBRSaKM8REQ6fRKTI_LcaSgo8AAAAAAAAAAAAAFCOzwWfYEfZJ14qCcBC6tf1yre4fxaUjiwsvuPOZvLy-gxyVs8WzcfXO5EG3IdzFW40EIXBlA4Yia_WVCABIgED1Kjk3Q; n_mh=sFuKj0sIaC8QVIU7KH4eHHqeMtw2gTEQqU3fF8qL2Ok; uid_tt=7d1fe25de0d9dab0027e91b5fb045492; uid_tt_ss=7d1fe25de0d9dab0027e91b5fb045492; sid_tt=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid=4e5c8fc64d8648b4dce66671a8aa26c7; sessionid_ss=4e5c8fc64d8648b4dce66671a8aa26c7; is_staff_user=false; has_biz_token=false; sid_guard=4e5c8fc64d8648b4dce66671a8aa26c7|1783935135|5184000|Fri,+11-Sep-2026+09:32:15+GMT; session_tlb_tag=sttt|2|TlyPxk2GSLTc5mZxqKomx__________w8-4tTwj4kpowfznczwoymSbhG23RL-e_hNM2CegkQVM; sid_ucp_v1=1.0.0-KDM0NThmMGZkNjc1YzQ4ZDdiNDFkM2Q3YTgzOTk0ZDU2YzM1YmRkYmQKKQjridmkiwIQn-HS0gYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJscSIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yzc; ssid_ucp_v1=1.0.0-KDM0NThmMGZkNjc1YzQ4ZDdiNDFkM2Q3YTgzOTk0ZDU2YzM1YmRkYmQKKQjridmkiwIQn-HS0gYYqMgXIAwoq9DBv62s5AYw6JbxzgU4B0D0B0gEGgJscSIgNGU1YzhmYzY0ZDg2NDhiNGRjZTY2NjcxYThhYTI2Yzc; ttwid=1|o8gTDO5GMJURx-KPO4XnN6daBlovoquMFr1nXVK--Ho|1784163096|a6043b995e342b4215276462ec30356276d041b9ca870b0c1f98942a6a2c9854',
    Accept: '*/*',
    Connection: 'keep-alive'
  },
  data: '{"track_id":"7330519021324830722","media_type":"track","queue_type":"self_playlist","scene_name":"library"}'
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});