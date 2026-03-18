export const LEVEL_UP_EVENT = "level-up";

export interface LevelUpDetail {
  amount: number;
}

export const emitLevelup = (amount: number) => {
  if (typeof window === "undefined") return;
  const detail: LevelUpDetail = { amount };
  window.dispatchEvent(new CustomEvent<LevelUpDetail>(LEVEL_UP_EVENT, { detail }));
};
