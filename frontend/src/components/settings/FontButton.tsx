interface FontButtonProps {
  title: string;
  fontChangeFunction: (fontName: string) => void;
}

const formatFontName = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const COMPACT_SCRIPT_FONTS = new Set(["kalam", "caveat", "gloria-hallelujah", "shadows-into-light"]);

const isCompactScriptFont = (value: string) => COMPACT_SCRIPT_FONTS.has(value);

/**
 * Renders a compact font preview card.
 * @param root0 - Component props.
 * @param root0.title - The font label and identifier.
 * @param root0.fontChangeFunction - Callback to update the active font.
 */
export default function FontButton({ title, fontChangeFunction }: FontButtonProps) {
  const previewSizeClass = isCompactScriptFont(title) ? "text-[2rem]" : "text-2xl";
  const titleSizeClass = isCompactScriptFont(title) ? "text-base" : "text-sm";

  return (
    <div data-font={title} className="h-full">
      <button
        type="button"
        onClick={() => fontChangeFunction(title)}
        className="flex h-full w-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500">
          Font
        </div>
        <div className={`mt-4 leading-none text-gray-900 ${previewSizeClass}`}>
          Ag
        </div>
        <div className="mt-4">
          <div className={`font-semibold text-gray-900 ${titleSizeClass}`}>
            {formatFontName(title)}
          </div>
        </div>
      </button>
    </div>
  );
}
