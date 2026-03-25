import { AppNavbar, FontButton, ThemeButton } from "@/components/index.ts";

interface ThemesPageContentProps {
  themeOptions: string[];
  fontOptions: string[];
  onThemeChange: (themeName: string) => void;
  onFontChange: (fontName: string) => void;
}

const LIGHT_THEME_OPTIONS = [
  "light",
  "bento",
  "taro",
  "paper",
  "sea-glass",
  "coral",
  "ivy",
  "arctic",
];

const DARK_THEME_OPTIONS = [
  "dark",
  "midnight",
  "retro",
  "terminal",
  "forest-night",
  "plum-ink",
  "neon-noir",
  "signal",
];

/**
 * Renders the standalone themes and fonts selection page.
 * @param props - Themes page content props.
 * @param props.themeOptions - Available theme names.
 * @param props.fontOptions - Available font names.
 * @param props.onThemeChange - Callback to apply a theme.
 * @param props.onFontChange - Callback to apply a font.
 * @returns The presentational themes page.
 */
const ThemesPageContent = ({
  themeOptions,
  fontOptions,
  onThemeChange,
  onFontChange,
}: ThemesPageContentProps) => (
  <div>
    <div>
      <AppNavbar />
    </div>

    <div>
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Appearance</h1>
          <p className="mt-2 text-sm text-gray-500">
            Pick a theme and font from compact preview cards.
          </p>
        </div>
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Themes</h2>
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Light Themes
              </h3>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {themeOptions
                  .filter((themeName) => LIGHT_THEME_OPTIONS.includes(themeName))
                  .map((themeName) => (
                    <ThemeButton
                      key={themeName}
                      title={themeName}
                      themeChangeFunction={onThemeChange}
                    />
                  ))}
              </section>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Dark Themes
              </h3>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {themeOptions
                  .filter((themeName) => DARK_THEME_OPTIONS.includes(themeName))
                  .map((themeName) => (
                    <ThemeButton
                      key={themeName}
                      title={themeName}
                      themeChangeFunction={onThemeChange}
                    />
                  ))}
              </section>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Fonts</h2>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {fontOptions.map((fontName) => (
              <FontButton
                key={fontName}
                title={fontName}
                fontChangeFunction={onFontChange}
              />
            ))}
          </section>
        </div>
      </main>
    </div>
  </div>
);

export default ThemesPageContent;
