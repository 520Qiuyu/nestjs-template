/** 网易云专辑（歌曲 al） */
export interface NeteaseAlbum {
  /** 专辑 ID */
  id: number;
  /** 专辑名称 */
  name: string;
  /** 封面地址 */
  picUrl: string;
  /** 翻译名 */
  tns: string[];
  /** 封面 ID 字符串 */
  pic_str: string;
  /** 封面 ID */
  pic: number;
}
