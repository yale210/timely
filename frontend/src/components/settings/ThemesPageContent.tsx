import { AppNavbar, FontButton, ThemeButton } from "@/components/index.ts";

interface ThemesPageContentProps {
  themeOptions: string[];
  fontOptions: string[];
  onThemeChange: (themeName: string) => void;
  onFontChange: (fontName: string) => void;
}

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
      <main className="mx-auto px-6 py-10 lg:px-8">
        <h1 className="text-3xl"> Themes </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {themeOptions.map((themeName) => (
            <ThemeButton
              key={themeName}
              title={themeName}
              themeChangeFunction={onThemeChange}
            />
          ))}
        </section>

        <h1 className="text-3xl"> Fonts </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {fontOptions.map((fontName) => (
            <FontButton
              key={fontName}
              title={fontName}
              fontChangeFunction={onFontChange}
            />
          ))}
        </section>
      </main>
    </div>
  </div>
);

export default ThemesPageContent;
