/** 网易云免费试听权益 */
export interface NeteaseFreeTrialPrivilege {
  resConsumable: boolean;
  userConsumable: boolean;
  listenType: number | null;
  cannotListenReason: number | null;
  playReason: unknown | null;
  freeLimitTagType: unknown | null;
}

/** 网易云音质计费信息 */
export interface NeteaseChargeInfo {
  /** 码率 */
  rate: number;
  chargeUrl: string | null;
  chargeMessage: string | null;
  /** 计费类型，0 免费 / 1 收费 */
  chargeType: number;
}

/** 网易云歌曲播放 / 下载权限 */
export interface NeteasePrivilege {
  /** 歌曲 ID */
  id: number;
  /** 收费类型 */
  fee: number;
  /** 是否已购买 */
  payed: number;
  /** 实际是否已购买（详情接口可能返回） */
  realPayed?: number;
  /** 歌曲状态，小于 0 表示不可播 */
  st: number;
  /** 可播放最高码率，0 表示不可播 */
  pl: number;
  /** 可下载最高码率 */
  dl: number;
  sp: number;
  cp: number;
  subp: number;
  cs: boolean;
  /** 音源最高码率 */
  maxbr: number;
  fl: number;
  /** 详情接口可能返回 */
  pc?: unknown | null;
  toast: boolean;
  flag: number;
  /** 详情接口可能返回 */
  paidBigBang?: boolean;
  preSell: boolean;
  playMaxbr: number;
  downloadMaxbr: number;
  maxBrLevel: string;
  playMaxBrLevel: string;
  downloadMaxBrLevel: string;
  plLevel: string;
  dlLevel: string;
  flLevel: string;
  rscl: unknown | null;
  freeTrialPrivilege: NeteaseFreeTrialPrivilege;
  rightSource: number;
  chargeInfoList: NeteaseChargeInfo[];
  code: number;
  message: string | null;
  plLevels: unknown | null;
  dlLevels: unknown | null;
  ignoreCache: unknown | null;
  bd: unknown | null;
}
