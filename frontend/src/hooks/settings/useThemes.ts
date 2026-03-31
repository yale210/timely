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

const THEME_OPTIONS = [
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
];

const FONT_OPTIONS = [
  "poppins",
  "comfortaa",
  "righteous",
  "fira-code",
  "kalam",
  "gloria-hallelujah",
  "bitcount",
  "bebas-neue",
];

function buildThemesResult(): UseThemesReturn {
  return {
    state: {
      themeOptions: THEME_OPTIONS,
      fontOptions: FONT_OPTIONS,
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
}

/**
 * Provides theme and font actions for the themes page.
 * @returns Structured state, loading, error, and theme actions.
 */
export const useThemes = (): UseThemesReturn => {
  return buildThemesResult();
};
