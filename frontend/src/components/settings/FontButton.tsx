interface FontButtonProps {
  title: string;
  fontChangeFunction: (fontName: string) => void;
}

const formatFontName = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/**
 * Renders a compact font preview card.
 * @param root0 - Component props.
 * @param root0.title - The font label and identifier.
 * @param root0.fontChangeFunction - Callback to update the active font.
 */
export default function FontButton({ title, fontChangeFunction }: FontButtonProps) {
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
        <div className="mt-4 text-2xl leading-none text-gray-900">
          Ag
        </div>
        <div className="mt-4">
          <div className="text-sm font-semibold text-gray-900">
            {formatFontName(title)}
          </div>
          <div className="mt-1 text-[12px] text-gray-500">
            Apply this type style across the app.
          </div>
        </div>
      </button>
    </div>
  );
}
