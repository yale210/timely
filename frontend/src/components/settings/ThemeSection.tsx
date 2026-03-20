import { FontButton, ThemeButton } from "@/components";

const lightThemeOptions = [
  "light",
  "bento",
  "taro",
  "paper",
  "sea-glass",
  "coral",
  "ivy",
  "arctic",
] as const;

const darkThemeOptions = [
  "dark",
  "midnight",
  "retro",
  "terminal",
  "forest-night",
  "plum-ink",
  "neon-noir",
  "signal",
] as const;

const fontOptions = [
  "poppins",
  "comfortaa",
  "righteous",
  "fira-code",
  "kalam",
  "gloria-hallelujah",
  "bitcount",
  "bebas-neue",
] as const;

interface ThemeSectionProps {
  onThemeChange: (themeName: string) => void;
  onFontChange: (fontName: string) => void;
}

const ThemeSection = ({ onThemeChange, onFontChange }: ThemeSectionProps) => (
  <>
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-gray-900">Appearance</h2>
      <p className="text-sm text-gray-500">
        Choose the colour theme and type style used across the app.
      </p>
    </div>
    <div className="mt-8 space-y-10">
      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Themes</h3>
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Light Themes
            </h4>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {lightThemeOptions.map((themeName) => (
                <ThemeButton
                  key={themeName}
                  title={themeName}
                  themeChangeFunction={onThemeChange}
                />
              ))}
            </section>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Dark Themes
            </h4>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {darkThemeOptions.map((themeName) => (
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
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">Fonts</h3>
        </div>
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
    </div>
  </>
);

export default ThemeSection;
