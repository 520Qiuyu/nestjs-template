// undefinedToNull
export type UndefinedToNull<T> = undefined extends T ? T | null : T;
// 将interface中的？类型转成 undefined|null类型
export type InterfaceToUndefinedNull<T> = {
  [K in keyof T]: UndefinedToNull<T[K]>;
};

// 响应类型
export interface Response<T> {
  code: number;
  message: string;
  data: InterfaceToUndefinedNull<T> | null;
}

// 测试用例
interface Test {
  a: string;
  b?: number;
  c: undefined;
  d?: null;
}
const test: InterfaceToUndefinedNull<Test> = {
  a: '1',
  b: null,
  c: undefined,
  d: undefined,
};
