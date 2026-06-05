// 响应类型
export interface Response<T> {
  code: number;
  message: string;
  data: T;
}
