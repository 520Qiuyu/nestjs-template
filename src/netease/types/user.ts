/** 网易云用户（歌单创建者 / 订阅者等） */
export interface NeteaseUser {
  /** 是否默认头像 */
  defaultAvatar: boolean;
  /** 省份代码 */
  province: number;
  /** 认证状态 */
  authStatus: number;
  /** 是否已关注 */
  followed: boolean;
  /** 头像地址 */
  avatarUrl: string;
  /** 账号状态 */
  accountStatus: number;
  /** 性别 */
  gender: number;
  /** 城市代码 */
  city: number;
  /** 生日时间戳 */
  birthday: number;
  /** 用户 ID */
  userId: number;
  /** 用户类型 */
  userType: number;
  /** 昵称 */
  nickname: string;
  /** 个性签名 */
  signature: string;
  /** 描述 */
  description: string;
  /** 详细描述 */
  detailDescription: string;
  /** 头像图片 ID */
  avatarImgId: number;
  /** 背景图 ID */
  backgroundImgId: number;
  /** 背景图地址 */
  backgroundUrl: string;
  /** 权限 */
  authority: number;
  /** 是否互相关注 */
  mutual: boolean;
  /** 达人标签 */
  expertTags: string[] | null;
  /** 达人信息 */
  experts: Record<string, string> | null;
  /** DJ 状态 */
  djStatus: number;
  /** VIP 类型 */
  vipType: number;
  /** 备注名 */
  remarkName: string | null;
  /** 认证类型位 */
  authenticationTypes: number;
  /** 头像认证详情 */
  avatarDetail: unknown | null;
  /** 头像图片 ID 字符串 */
  avatarImgIdStr: string;
  /** 背景图 ID 字符串 */
  backgroundImgIdStr: string;
  /** 是否主播 */
  anchor: boolean;
  /** 头像图片 ID 字符串（兼容字段） */
  avatarImgId_str?: string;
}

/** 网易云单项 VIP 套餐信息 */
export interface NeteaseVipPackage {
  /** VIP 类型码 */
  vipCode: number;
  /** 过期时间戳（毫秒，0 表示未开通） */
  expireTime: number;
  /** 静态图标 */
  iconUrl: string | null;
  /** 动态图标 */
  dynamicIconUrl: string | null;
  /** VIP 等级 */
  vipLevel: number;
  /** 是否签约抵扣 */
  isSignDeduct: boolean;
  /** 是否 IAP 签约 */
  isSignIap: boolean;
  /** 是否 IAP 签约抵扣 */
  isSignIapDeduct: boolean;
  /** 是否签约中 */
  isSign: boolean;
}

/** 网易云用户 VIP 信息 */
export interface NeteaseVipInfo {
  /** 红心 VIP 等级图标 */
  redVipLevelIcon: string;
  /** 红心 VIP 等级 */
  redVipLevel: number;
  /** 连续包年次数 */
  redVipAnnualCount: number;
  /** 音乐包 */
  musicPackage: NeteaseVipPackage;
  /** 黑胶 VIP */
  associator: NeteaseVipPackage;
  /** 红心 VIP 动态图标 */
  redVipDynamicIconUrl: string | null;
  /** 家庭 VIP */
  familyVip: NeteaseVipPackage;
  /** 红心 VIP 动态图标 2 */
  redVipDynamicIconUrl2: string | null;
  /** 黑胶 SVIP（redplus） */
  redplus: NeteaseVipPackage;
}

/** 用户 SVIP 状态 */
export interface NeteaseSvipInfo {
  /** 是否在期 SVIP */
  isSvip: boolean;
  /** 过期时间戳（毫秒） */
  expireTime: number;
  /** VIP 等级 */
  vipLevel: number;
  /** VIP 类型码 */
  vipCode: number;
  /** 静态图标 */
  iconUrl: string | null;
}
