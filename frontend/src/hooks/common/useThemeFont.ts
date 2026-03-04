import { useEffect } from "react";

/**
 * Applies saved theme and font values to document root data attributes.
 */
export const useThemeFont = (): void => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);
};
