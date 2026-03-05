import type { Category } from "@/types";
import { hexToRgba } from "@/utils/colorUtils";

interface SelectedCategoryChipsProps {
  selectedCategories: Category[];
  defaultSwatch: string;
  onToggle: (id: number) => void;
}

export const SelectedCategoryChips = ({
  selectedCategories,
  defaultSwatch,
  onToggle,
}: SelectedCategoryChipsProps) => (
  <div className="flex flex-wrap gap-2">
    {selectedCategories.length === 0 && (
      <span className="text-xs text-gray-400">No categories selected.</span>
    )}
    {selectedCategories.map((category) => {
      const colourValue = category.colour ?? defaultSwatch;
      return (
        <button
          key={category.id}
          type="button"
          onClick={() => onToggle(category.id)}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold text-black transition-colors"
          style={{
            borderColor: colourValue,
            backgroundColor: hexToRgba(colourValue, 0.12),
          }}
        >
          {category.text}
          <span className="text-[12px] font-semibold leading-none">{"\u2716"}</span>
        </button>
      );
    })}
  </div>
);
