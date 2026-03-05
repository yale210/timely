import { createPortal } from "react-dom";
import type { Category } from "@/types";
import { hexToRgba } from "@/utils/colorUtils";

interface CategoryDropdownProps {
  isOpen: boolean;
  dropdownPosition: { top: number; left: number; width: number } | null;
  dropdownMaxHeight: number;
  filtered: Category[];
  selectedIds: number[];
  defaultSwatch: string;
  normalizedQuery: string;
  query: string;
  canCreate: boolean;
  maxCategoryLength: number;
  isCreating: boolean;
  error: string | null;
  optionBaseClass: string;
  addBaseClass: string;
  onSelectOption: (id: number) => void;
  onCreate: () => void;
  onMenuOpen: (id: number, target: HTMLButtonElement) => void;
}

export const CategoryDropdown = ({
  isOpen,
  dropdownPosition,
  dropdownMaxHeight,
  filtered,
  selectedIds,
  defaultSwatch,
  normalizedQuery,
  query,
  canCreate,
  maxCategoryLength,
  isCreating,
  error,
  optionBaseClass,
  addBaseClass,
  onSelectOption,
  onCreate,
  onMenuOpen,
}: CategoryDropdownProps) => {
  if (!isOpen || !dropdownPosition || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-80 rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="overflow-y-auto py-1" style={{ maxHeight: dropdownMaxHeight }}>
        {filtered.length === 0 && !canCreate && (
          <div className="px-3 py-2 text-sm text-gray-500">
            No categories match.
          </div>
        )}
        {filtered.map((category) => {
          const isSelected = selectedIds.includes(category.id);
          const colourValue = category.colour ?? defaultSwatch;
          return (
            <div key={category.id} className="group flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectOption(category.id);
                }}
                className={`flex flex-1 min-w-0 items-center gap-2 text-left text-sm ${optionBaseClass}`}
              >
                <span
                  className="truncate font-medium rounded-md border px-2 py-0.5 text-black"
                  style={{
                    borderColor: colourValue,
                    backgroundColor: hexToRgba(colourValue, 0.12),
                  }}
                >
                  {isSelected ? `${category.text} \u2713` : category.text}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Open actions for ${category.text}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuOpen(category.id, event.currentTarget);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons text-base">more_vert</span>
                </button>
              </div>
            </div>
          );
        })}
        {canCreate && (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onCreate();
            }}
            className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold ${addBaseClass}`}
          >
            <span>Add new category "{query.trim()}"</span>
            <span className="material-icons text-base">add</span>
          </button>
        )}
        {normalizedQuery.length > maxCategoryLength && (
          <div className="px-3 py-2 text-xs text-red-600">
            Category names must be {maxCategoryLength} characters or fewer.
          </div>
        )}
        {isCreating && (
          <div className="px-3 py-2 text-xs text-gray-500">Creating category...</div>
        )}
        {error && (
          <div className="px-3 py-2 text-xs text-red-600">{error}</div>
        )}
      </div>
    </div>,
    document.body,
  );
};
