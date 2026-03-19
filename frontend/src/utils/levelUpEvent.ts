/**
 * Browser event name for level-up notifications.
 */
export const LEVEL_UP_EVENT = "level-up";

/**
 * Payload for a level-up event.
 */
export interface LevelUpDetail {
  amount: number;
}

/**
 * Emits a level-up event with the new level.
 */
export const emitLevelup = (amount: number) => {
  if (typeof window === "undefined") return;
  const detail: LevelUpDetail = { amount };
  window.dispatchEvent(new CustomEvent<LevelUpDetail>(LEVEL_UP_EVENT, { detail }));
};
