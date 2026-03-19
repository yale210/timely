/**
 * Browser event name for gained XP notifications.
 */
export const XP_GAINED_EVENT = "xp-gained";

/**
 * Payload for an XP gained event.
 */
export interface XpGainedDetail {
  amount: number;
}

/**
 * Emits an XP gained event with the amount.
 */
export const emitXpGained = (amount: number) => {
  if (typeof window === "undefined") return;
  const detail: XpGainedDetail = { amount };
  window.dispatchEvent(new CustomEvent<XpGainedDetail>(XP_GAINED_EVENT, { detail }));
};
