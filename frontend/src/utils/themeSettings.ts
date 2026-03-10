/**
 * Persist and apply the selected theme name on the document.
 * @param themeName - Theme identifier.
 */
export const applyTheme = (themeName: string) => {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
};

/**
 * Persist and apply the selected font name on the document.
 * @param fontName - Font identifier.
 */
export const applyFont = (fontName: string) => {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
};
