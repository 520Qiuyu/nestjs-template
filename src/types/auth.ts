import type { Status } from "./global";

/** JWT 载荷 */
export type JwtPayload = {
  account: string;
  id: string;
  status: Status;
};
