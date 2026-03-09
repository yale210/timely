/**
 * Applies a colour theme to the document and persists the choice.
 * @param themeName - The theme identifier to activate.
 */
export const applyTheme = (themeName: string) => {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
};

/**
 * Applies a font family to the document and persists the choice.
 * @param fontName - The font identifier to activate.
 */
export const applyFont = (fontName: string) => {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
};
