import { useMemo } from "react";
import { applyFont, applyTheme } from "@/utils/themeSettings";

interface ThemesState {
  themeOptions: string[];
  fontOptions: string[];
}

interface ThemesLoading {
  theme: boolean;
  font: boolean;
}

interface ThemesError {
  theme: string | null;
  font: string | null;
}

interface ThemesActions {
  applyTheme: (themeName: string) => void;
  applyFont: (fontName: string) => void;
}

/**
 * Describes the structured themes hook contract.
 */
export interface UseThemesReturn {
  state: ThemesState;
  loading: ThemesLoading;
  error: ThemesError;
  actions: ThemesActions;
}

/**
 * Provides theme and font actions for the themes page.
 * @returns Structured state, loading, error, and theme actions.
 */
export const useThemes = (): UseThemesReturn => {
  const themeOptions = useMemo(
    () => [
      "light",
      "dark",
      "midnight",
      "retro",
      "bento",
      "taro",
      "paper",
      "terminal",
      "sea-glass",
      "coral",
      "forest-night",
      "plum-ink",
      "neon-noir",
      "ivy",
      "arctic",
      "signal",
    ],
    [],
  );
  const fontOptions = useMemo(
    () => [
      "poppins",
      "comfortaa",
      "righteous",
      "fira-code",
      "kalam",
      "gloria-hallelujah",
      "bitcount",
      "bebas-neue",
    ],
    [],
  );

  return {
    state: {
      themeOptions,
      fontOptions,
    },
    loading: {
      theme: false,
      font: false,
    },
    error: {
      theme: null,
      font: null,
    },
    actions: {
      applyTheme,
      applyFont,
    },
  };
};
