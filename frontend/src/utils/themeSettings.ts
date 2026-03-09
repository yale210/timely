/**
 *
 */
export const /**
              *
              * @param themeName
              */
applyTheme = (themeName: string) => {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
};

/**
 *
 */
export const /**
              *
              * @param fontName
              */
applyFont = (fontName: string) => {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
};
