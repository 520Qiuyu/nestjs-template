type CardSecretTimeFields = {
  type: string;
  expireTime?: Date | null;
  enableTime?: Date | null;
  validDays?: number | null;
};

/**
 * 按日历天叠加日期（有效期天数）
 * @example
 * ```ts
 * addCalendarDays(new Date('2026-08-17T10:00:00'), 30)
 * ```
 */
export const addCalendarDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * 由启用时间 + 有效期天数计算到期时间；未启用或未配置则返回 null。
 * 与 expireTime 相互独立，不互相改写。
 * @example
 * ```ts
 * getValidDaysExpireAt(new Date('2026-08-17'), 30)
 * ```
 */
export const getValidDaysExpireAt = (
  enableTime?: Date | null,
  validDays?: number | null,
) => {
  if (!enableTime || validDays == null || validDays <= 0) {
    return null;
  }
  return addCalendarDays(enableTime, validDays);
};

/**
 * 判断时长卡是否过期。
 * expireTime 保持原校验；validDays 在已启用后另外计算，二者任一过期即视为过期。
 * @example
 * ```ts
 * isCardSecretExpired({ type: 'time', expireTime: null, enableTime: null, validDays: 30 })
 * ```
 */
export const isCardSecretExpired = (
  card: CardSecretTimeFields,
  now: Date = new Date(),
) => {
  if (card.type !== 'time') {
    return false;
  }
  if (card.expireTime && card.expireTime < now) {
    return true;
  }
  const validDaysExpireAt = getValidDaysExpireAt(
    card.enableTime,
    card.validDays,
  );
  if (validDaysExpireAt && validDaysExpireAt < now) {
    return true;
  }
  return false;
};
