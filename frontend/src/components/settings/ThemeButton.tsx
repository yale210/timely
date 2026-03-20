import "@/styles/index_theme.css";

interface ThemeButtonProps {
  title: string;
  themeChangeFunction: (themeName: string) => void;
}

const formatThemeName = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/**
 * Renders a compact theme preview card with visible colour swatches.
 * @param root0 - Component props.
 * @param root0.title - The theme name and identifier.
 * @param root0.themeChangeFunction - Callback to update the active theme.
 */
export default function ThemeButton({ title, themeChangeFunction }: ThemeButtonProps) {
  return (
    <div data-theme={title} className="h-full">
      <button
        type="button"
        onClick={() => themeChangeFunction(title)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--background) text-left text-(--text-color) shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex min-h-24 flex-col justify-end gap-3 bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))] px-4 py-3">
          <div className="text-sm font-semibold tracking-[0.08em] uppercase">
            {formatThemeName(title)}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border border-(--border) bg-(--background)" />
            <span className="h-3.5 w-3.5 rounded-full border border-(--border) bg-(--text-color)" />
            <span className="h-3.5 w-3.5 rounded-full border border-(--border) bg-(--primary)" />
          </div>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl border border-(--border) bg-[color-mix(in_srgb,var(--text-color)_4%,var(--background))] p-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-(--text-color)/60">
              Surface
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-16 rounded-full bg-(--primary)" />
              <span className="h-2.5 flex-1 rounded-full bg-[color-mix(in_srgb,var(--text-color)_10%,var(--background))]" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
