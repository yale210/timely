import { useEffect } from "react";
import { setDocumentTheme } from "@/utils/themeSettings";

/**
 * Applies saved theme and font values to document root data attributes.
 */
export const useThemeFont = (): void => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDocumentTheme(savedTheme);
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);
};
