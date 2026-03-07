export const applyTheme = (themeName: string) => {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
};

export const applyFont = (fontName: string) => {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
};
