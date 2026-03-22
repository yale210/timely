import { FontButton, ThemeButton } from "@/components";

interface ThemeSectionProps {
  onThemeChange: (themeName: string) => void;
  onFontChange: (fontName: string) => void;
}

const ThemeSection = ({ onThemeChange, onFontChange }: ThemeSectionProps) => (
  <>
    <h2 className="text-lg font-semibold">Appearance</h2>
    <p className="mt-2 text-sm text-gray-600">
      Choose a theme and font for your dashboard.
    </p>
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Themes</h3>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        <ThemeButton title="dark" themeChangeFunction={onThemeChange} />
        <ThemeButton title="light" themeChangeFunction={onThemeChange} />
        <ThemeButton title="retro" themeChangeFunction={onThemeChange} />
        <ThemeButton title="bento" themeChangeFunction={onThemeChange} />
        <ThemeButton title="taro" themeChangeFunction={onThemeChange} />
      </section>

      <h3 className="text-xl font-semibold mb-4">Fonts</h3>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <FontButton title="poppins" fontChangeFunction={onFontChange} />
        <FontButton title="pacifico" fontChangeFunction={onFontChange} />
        <FontButton title="comic-sans" fontChangeFunction={onFontChange} />
        <FontButton title="bitcount" fontChangeFunction={onFontChange} />
        <FontButton title="bebas-neue" fontChangeFunction={onFontChange} />
      </section>
    </div>
  </>
);

export default ThemeSection;
