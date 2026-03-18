export const XP_GAINED_EVENT = "xp-gained";

export interface XpGainedDetail {
  amount: number;
}

export const emitXpGained = (amount: number) => {
  if (typeof window === "undefined") return;
  const detail: XpGainedDetail = { amount };
  window.dispatchEvent(new CustomEvent<XpGainedDetail>(XP_GAINED_EVENT, { detail }));
};
