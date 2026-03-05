import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Category } from "@/types";

type CategoryVariant = "task" | "event";

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  variant: CategoryVariant;
}

const MAX_CATEGORY_LENGTH = 20;
const DEFAULT_SWATCH = "#94a3b8";
const PRESET_COLOURS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#64748b",
];

const VARIANT_STYLES: Record<CategoryVariant, {
  inputFocus: string;
  chipSelected: string;
  chipBase: string;
  optionSelected: string;
  optionBase: string;
  addBase: string;
}> = {
  task: {
    inputFocus: "focus:ring-primary focus:border-primary",
    chipSelected: "bg-blue-50 text-primary border-primary",
    chipBase: "bg-gray-100 text-gray-600 hover:bg-blue-100",
    optionSelected: "bg-blue-50 text-primary",
    optionBase: "text-gray-700 hover:bg-gray-50",
    addBase: "text-primary hover:bg-blue-50",
  },
  event: {
    inputFocus: "focus:ring-orange-500 focus:border-orange-500",
    chipSelected: "bg-orange-50 text-orange-600 border-orange-500",
    chipBase: "bg-gray-100 text-gray-600 hover:bg-orange-100",
    optionSelected: "bg-orange-50 text-orange-600",
    optionBase: "text-gray-700 hover:bg-gray-50",
    addBase: "text-orange-600 hover:bg-orange-50",
  },
};

const normalise = (value: string) => value.trim().toLowerCase();
const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CategoryMultiSelect = ({
  categories,
  selectedIds,
  onChange,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  variant,
}: CategoryMultiSelectProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const styles = VARIANT_STYLES[variant];
  const normalizedQuery = normalise(query);

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedIds.includes(category.id)),
    [categories, selectedIds],
  );

  const filtered = useMemo(() => {
    if (!normalizedQuery) {
      return categories;
    }
    return categories.filter((category) =>
      category.text.toLowerCase().includes(normalizedQuery),
    );
  }, [categories, normalizedQuery]);

  const exactMatch = useMemo(
    () => categories.some((category) => category.text.toLowerCase() === normalizedQuery),
    [categories, normalizedQuery],
  );

  const canCreate =
    normalizedQuery.length > 0 &&
    !exactMatch &&
    normalizedQuery.length <= MAX_CATEGORY_LENGTH;

  const toggleCategory = (id: number) => {
    setError(null);
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
        : [...selectedIds, id],
    );
  };

  const handleCreate = async () => {
    if (!canCreate || isCreating) {
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const created = await onCreateCategory(query.trim());
      onChange([...selectedIds, created.id]);
      setQuery("");
      setIsOpen(false);
    } catch (createError) {
      console.error(createError);
      setError("Unable to create category.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (canCreate) {
        void handleCreate();
        return;
      }
      if (filtered.length > 0) {
        toggleCategory(filtered[0].id);
        setQuery("");
        setIsOpen(false);
      }
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (openMenuId === null) {
        setIsOpen(false);
      }
    }, 120);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await onDeleteCategory(id);
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((value) => value !== id));
      }
    } catch (deleteError) {
      console.error(deleteError);
      setError("Unable to delete category.");
    }
  };

  useEffect(() => {
    if (openMenuId === null) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {selectedCategories.length === 0 && (
          <span className="text-xs text-gray-400">No categories selected.</span>
        )}
        {selectedCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${styles.chipBase} ${styles.chipSelected}`}
          >
            {category.text}
            <span className="material-icons text-[14px]">close</span>
          </button>
        ))}
      </div>

      <div className="relative mt-2">
        <input
          type="text"
          value={query}
          placeholder="Type to search or add category..."
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border border-gray-300 bg-white text-black shadow-sm p-2.5 ${styles.inputFocus}`}
        />

        {isOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && !canCreate && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No categories match.
                </div>
              )}
              {filtered.map((category) => {
                const isSelected = selectedIds.includes(category.id);
                const colourValue = category.colour ?? DEFAULT_SWATCH;
                return (
                  <div key={category.id} className="group flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        toggleCategory(category.id);
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className={`flex flex-1 min-w-0 items-center gap-2 text-left text-sm ${styles.optionBase}`}
                    >
                      <span
                        className="truncate font-medium rounded-md border px-2 py-0.5 text-black"
                        style={{
                          borderColor: colourValue,
                          backgroundColor: hexToRgba(colourValue, 0.12),
                        }}
                      >
                        {category.text}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="material-icons text-base text-gray-500">check</span>
                      )}
                      <button
                        type="button"
                        aria-label={`Open actions for ${category.text}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (openMenuId === category.id) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                            return;
                          }
                          const target = event.currentTarget;
                          const rect = target.getBoundingClientRect();
                          const menuWidth = 176;
                          const estimatedHeight = 220;
                          const padding = 8;
                          const preferredLeft = rect.right - menuWidth;
                          const left = Math.min(
                            Math.max(preferredLeft, padding),
                            window.innerWidth - menuWidth - padding,
                          );
                          const preferredTop = rect.bottom + 6;
                          const top = Math.min(
                            Math.max(preferredTop, padding),
                            window.innerHeight - estimatedHeight - padding,
                          );
                          setMenuPosition({ top, left });
                          setOpenMenuId(category.id);
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
                    void handleCreate();
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold ${styles.addBase}`}
                >
                  <span>Add new category "{query.trim()}"</span>
                  <span className="material-icons text-base">add</span>
                </button>
              )}
              {normalizedQuery.length > MAX_CATEGORY_LENGTH && (
                <div className="px-3 py-2 text-xs text-red-600">
                  Category names must be {MAX_CATEGORY_LENGTH} characters or fewer.
                </div>
              )}
              {isCreating && (
                <div className="px-3 py-2 text-xs text-gray-500">Creating category...</div>
              )}
              {error && (
                <div className="px-3 py-2 text-xs text-red-600">{error}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {openMenuId !== null && menuPosition && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1000] w-44 rounded-lg border border-gray-200 bg-white shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                void handleDelete(openMenuId);
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <span className="material-icons text-base">delete</span>
              Delete
            </button>
            <div className="my-1 border-t border-gray-200" />
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Colours
            </div>
            <div className="grid grid-cols-6 gap-2 px-3 pb-3">
              {PRESET_COLOURS.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  aria-label={`Set colour ${colour}`}
                  onClick={() => {
                    void onUpdateCategory(openMenuId, { colour });
                    setOpenMenuId(null);
                    setMenuPosition(null);
                  }}
                  className="h-5 w-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: colour }}
                />
              ))}
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
};

export default CategoryMultiSelect;
