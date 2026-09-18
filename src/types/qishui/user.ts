import type { QishuiImage } from './track';

/** 汽水接口公共状态信息 */
export interface QishuiStatusInfo {
  /** 日志 ID */
  log_id?: string;
  /** 服务端时间（秒） */
  now?: number;
  /** 服务端时间（毫秒） */
  now_ts_ms?: number;
}

/** 汽水用户地理位置 */
export interface QishuiUserLocation {
  country?: string;
  iso_country_code?: string;
  province?: string;
  city?: string;
  district?: string;
  location_hide_level?: number;
  is_first_level_city?: boolean;
}

/** 汽水 AI 创作者信息 */
export interface QishuiAiCreatorInfo {
  enable_gen_mv?: boolean;
}

/** 汽水 VIP 档位 */
export type QishuiVipStage = 'svip' | 'vip' | (string & {});

/** 汽水当前登录用户资料 */
export interface QishuiMyInfo {
  /** 用户 ID */
  id: string;
  /** 昵称 */
  nickname: string;
  /** 抖音号 */
  douyin_id?: string;
  /** 大头像 */
  larger_avatar_url?: QishuiImage;
  /** 中头像 */
  medium_avatar_url?: QishuiImage;
  /** 个性签名 */
  signature?: string;
  /** 性别 */
  gender?: string;
  /** 年龄 */
  age?: number;
  /** 展示地区 */
  display_locations?: string[];
  /** 是否私密账号 */
  secret?: boolean;
  /** 生日 */
  birthday?: string;
  birthday_hide_level?: number;
  /** 所在地 */
  location?: QishuiUserLocation;
  school_info?: unknown | null;
  profile_hide_level?: number;
  is_music_curator?: boolean;
  /** 汽水注册时间（秒级时间戳） */
  luna_register_time?: number;
  ban_user_functions?: unknown[];
  is_musician?: boolean;
  user_artist_type?: number;
  masked_phone_no?: string;
  sec_uid?: string;
  /** 是否 VIP */
  is_vip?: boolean;
  /** VIP 档位，如 svip */
  vip_stage?: QishuiVipStage;
  is_live_active?: boolean;
  enable_app_list?: boolean;
  public_name?: string;
  ai_creator_info?: QishuiAiCreatorInfo;
}

/** 评论获赞弹窗 */
export interface QishuiCommentsLikedPopup {
  popup_type?: number;
  title?: string;
  content?: string;
  btn_text?: string;
}

/** 全部评论获赞详情 */
export interface QishuiAllCommentsLikedDetail {
  count?: string;
  popup?: QishuiCommentsLikedPopup;
  is_show?: boolean;
}

/** 粉丝数实验文案 */
export interface QishuiFollowerCountStrExp {
  enable?: boolean;
  follower_count_str_desc?: string;
}

/** 汽水当前登录用户统计 */
export interface QishuiMyStats {
  count_all_liked?: number;
  count_following?: number;
  count_follower?: number;
  count_luna_following?: number;
  count_luna_follower?: number;
  count_asset?: number;
  all_comments_liked_detail?: QishuiAllCommentsLikedDetail;
  count_friend?: number;
  count_follower_str_exp?: QishuiFollowerCountStrExp;
}

/** 汽水「我的」侧边栏单项 */
export interface QishuiMeTabSidebarItem {
  item_type?: string;
  title?: string;
  icon_url?: string;
}

/** 汽水「我的」侧边栏分组 */
export interface QishuiMeTabSidebarSection {
  section_type?: string;
  items?: QishuiMeTabSidebarItem[];
}

/** 汽水「我的」侧边栏 */
export interface QishuiMeTabSidebar {
  sections?: QishuiMeTabSidebarSection[];
}

/** 获取汽水 PC 端当前登录用户信息响应 */
export interface GetQishuiUserInfoResponse {
  status_code: number;
  status_info?: QishuiStatusInfo;
  /** 当前登录用户资料 */
  my_info?: QishuiMyInfo;
  /** 当前登录用户统计 */
  my_stats?: QishuiMyStats;
  /** 「我的」页侧边栏 */
  me_tab_sidebar?: QishuiMeTabSidebar;
}
