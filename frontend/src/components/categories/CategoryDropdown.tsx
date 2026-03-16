import { createPortal } from "react-dom";
import type { Category } from "@/types";
import { hexToRgba } from "@/utils/colorUtils";

/**
 * Props for the category dropdown list.
 * @param root0 - Component props.
 * @param root0.isOpen - Whether the dropdown is visible.
 * @param root0.dropdownPosition - The screen position and width.
 * @param root0.dropdownMaxHeight - Max height for the list.
 * @param root0.filtered - Filtered categories to display.
 * @param root0.selectedIds - Selected category ids.
 * @param root0.defaultSwatch - Fallback colour swatch.
 * @param root0.normalizedQuery - Lowercased search query.
 * @param root0.query - Raw search input.
 * @param root0.canCreate - Whether a new category can be created.
 * @param root0.maxCategoryLength - Maximum allowed category length.
 * @param root0.isCreating - Whether a create request is pending.
 * @param root0.error - Current error message.
 * @param root0.optionBaseClass - Base class for options.
 * @param root0.addBaseClass - Base class for create option.
 * @param root0.onSelectOption - Selects a category.
 * @param root0.onCreate - Creates a new category.
 * @param root0.onMenuOpen - Opens the actions menu.
 */
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

/**
 * Renders the dropdown list of categories with actions.
 * @param root0 - Component props.
 * @param root0.isOpen - Whether the dropdown is visible.
 * @param root0.dropdownPosition - The screen position and width.
 * @param root0.dropdownMaxHeight - Max height for the list.
 * @param root0.filtered - Filtered categories to display.
 * @param root0.selectedIds - Selected category ids.
 * @param root0.defaultSwatch - Fallback colour swatch.
 * @param root0.normalizedQuery - Lowercased search query.
 * @param root0.query - Raw search input.
 * @param root0.canCreate - Whether a new category can be created.
 * @param root0.maxCategoryLength - Maximum allowed category length.
 * @param root0.isCreating - Whether a create request is pending.
 * @param root0.error - Current error message.
 * @param root0.optionBaseClass - Base class for options.
 * @param root0.addBaseClass - Base class for create option.
 * @param root0.onSelectOption - Selects a category.
 * @param root0.onCreate - Creates a new category.
 * @param root0.onMenuOpen - Opens the actions menu.
 */
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
            <span>Add new category &quot;{query.trim()}&quot;</span>
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

