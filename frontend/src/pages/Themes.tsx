import ThemesPageContent from "@/components/settings/ThemesPageContent";
import { useThemes } from "@/hooks/settings/useThemes";

/**
 * Renders the standalone themes page using a thin container.
 * @returns The rendered themes page.
 */
export default function Themes() {
  const { state, actions } = useThemes();

  return (
    <ThemesPageContent
      themeOptions={state.themeOptions}
      fontOptions={state.fontOptions}
      onThemeChange={actions.applyTheme}
      onFontChange={actions.applyFont}
    />
  );
}
