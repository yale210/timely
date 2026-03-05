import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import type { Category } from "@/types";
import { Tooltip } from "@/components";
import { hexToRgba } from "@/utils/colorUtils";

type CategoryVariant = "task" | "event";

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
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
  "#20c7a3",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#92400e",
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(224);
  const [colourInput, setColourInput] = useState("");
  const [colourError, setColourError] = useState<string | null>(null);
  const [showPickerMenu, setShowPickerMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

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
      inputRef.current?.blur();
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
        inputRef.current?.blur();
      }
    }
  };

  const updateDropdownPosition = () => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const padding = 8;
    const width = rect.width;
    const left = Math.min(
      Math.max(rect.left, padding),
      window.innerWidth - width - padding,
    );
    const preferredHeight = 224;
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const useAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(preferredHeight, useAbove ? spaceAbove : spaceBelow));
    const top = useAbove ? rect.top - maxHeight - 6 : rect.bottom + 6;
    setDropdownMaxHeight(maxHeight);
    setDropdownPosition({ top, left, width });
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

  useEffect(() => {
    if (!openMenuId || !menuRef.current || !menuPosition) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      const rect = menuRef.current?.getBoundingClientRect();
      if (!rect) return;
      const padding = 8;
      let nextLeft = menuPosition.left;
      let nextTop = menuPosition.top;

      if (rect.right > window.innerWidth - padding) {
        nextLeft = Math.max(padding, window.innerWidth - rect.width - padding);
      }
      if (rect.left < padding) {
        nextLeft = padding;
      }
      if (rect.bottom > window.innerHeight - padding) {
        nextTop = Math.max(padding, window.innerHeight - rect.height - padding);
      }
      if (rect.top < padding) {
        nextTop = padding;
      }

      if (nextLeft !== menuPosition.left || nextTop !== menuPosition.top) {
        setMenuPosition({ left: nextLeft, top: nextTop });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [openMenuId, menuPosition]);

  useEffect(() => {
    if (!showPickerMenu || !pickerRef.current || !pickerPosition) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      const rect = pickerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const padding = 8;
      let nextLeft = pickerPosition.left;
      let nextTop = pickerPosition.top;

      if (rect.right > window.innerWidth - padding) {
        nextLeft = Math.max(padding, window.innerWidth - rect.width - padding);
      }
      if (rect.left < padding) {
        nextLeft = padding;
      }
      if (rect.bottom > window.innerHeight - padding) {
        nextTop = Math.max(padding, window.innerHeight - rect.height - padding);
      }
      if (rect.top < padding) {
        nextTop = padding;
      }

      if (nextLeft !== pickerPosition.left || nextTop !== pickerPosition.top) {
        setPickerPosition({ left: nextLeft, top: nextTop });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [showPickerMenu, pickerPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current && inputRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setIsOpen(false);
    };
    const handleScrollOrResize = () => {
      updateDropdownPosition();
    };
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    updateDropdownPosition();
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const normaliseHex = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.startsWith("#") && trimmed.length === 7) {
      return trimmed;
    }
    return null;
  };

  const rgbToHex = (value: string): string | null => {
    const match = value
      .trim()
      .toLowerCase()
      .match(/^rgb\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*\\)$/);
    if (!match) return null;
    const [r, g, b] = match.slice(1).map((v) => Math.min(255, Math.max(0, Number(v))));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const parseColourInput = (value: string): string | null =>
    normaliseHex(value) ?? rgbToHex(value);

  const menuCategory = openMenuId
    ? categories.find((category) => category.id === openMenuId)
    : undefined;
  useEffect(() => {
    if (menuCategory?.colour) {
      setColourInput(menuCategory.colour);
    } else {
      setColourInput("");
    }
    setShowPickerMenu(false);
    setColourError(null);
  }, [menuCategory?.colour, openMenuId]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {selectedCategories.length === 0 && (
          <span className="text-xs text-gray-400">No categories selected.</span>
        )}
        {selectedCategories.map((category) => {
          const colourValue = category.colour ?? DEFAULT_SWATCH;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold text-black transition-colors"
              style={{
                borderColor: colourValue,
                backgroundColor: hexToRgba(colourValue, 0.12),
              }}
            >
              {category.text}
              <span className="text-[12px] font-semibold leading-none">✖</span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Type to search or add category..."
          onFocus={() => {
            setIsOpen(true);
            updateDropdownPosition();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            updateDropdownPosition();
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border border-gray-300 bg-white text-black shadow-sm p-2.5 ${styles.inputFocus}`}
        />

        {isOpen && dropdownPosition && typeof document !== "undefined"
          ? createPortal(
            <div
              ref={dropdownRef}
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
                        inputRef.current?.blur();
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
                        {isSelected ? `${category.text} ✓` : category.text}
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
            </div>,
            document.body,
          )
          : null}
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
                    if (openMenuId === null) return;
                    void onUpdateCategory(openMenuId, { colour });
                  }}
                  className="h-5 w-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: colour }}
                />
              ))}
              <button
                ref={plusButtonRef}
                type="button"
                aria-label="Custom colour"
                onClick={() => {
                  if (!plusButtonRef.current) return;
                  const rect = plusButtonRef.current.getBoundingClientRect();
                  setPickerPosition({
                    top: rect.top - 280,
                    left: rect.left - 280,
                  });
                  setShowPickerMenu((prev) => !prev);
                }}
                className="h-5 w-5 rounded-full border border-gray-200 bg-white flex items-center justify-center"
              >
                <span className="text-[20px] leading-none text-gray-600">+</span>
              </button>
            </div>
            <div className="my-1 border-t border-gray-200" />
            <label className="flex items-center gap-2 px-3 pt-2 pb-3 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(menuCategory?.colour_override)}
                onChange={(event) => {
                  if (openMenuId === null) return;
                  void onUpdateCategory(openMenuId, { colour_override: event.target.checked });
                }}
                className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-400"
              />
              <span className="flex items-center gap-1">
                Colour override
                <Tooltip content="When enabled, tasks/events using this category inherit its colour.">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[11px] font-semibold text-gray-600 ml-2 cursor-help"
                  >
                    ?
                  </span>
                </Tooltip>
              </span>
            </label>
          </div>,
          document.body,
        )
        : null}

      {showPickerMenu && pickerPosition && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[1000] w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
            style={{ top: pickerPosition.top, left: pickerPosition.left }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Custom Colour
            </div>
            <div className="px-3 pb-3">
              <div className="rounded-lg border border-gray-200 bg-white p-2 overflow-hidden">
                <HexColorPicker
                  color={colourInput || menuCategory?.colour || DEFAULT_SWATCH}
                  onChange={(value) => {
                    setColourInput(value);
                    setColourError(null);
                  }}
                  style={{ width: "100%", height: "160px" }}
                  className="rounded-md"
                />
              </div>
            </div>
            <div className="px-3 pb-3">
              <input
                type="text"
                value={colourInput}
                onChange={(event) => {
                  setColourInput(event.target.value);
                  setColourError(null);
                }}
                placeholder="Hex (#RRGGBB) or rgb(...)"
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const parsed = parseColourInput(colourInput);
                  if (!parsed) {
                    setColourError("Enter a valid hex or rgb colour.");
                    return;
                  }
                  setColourInput(parsed);
                }}
              />
              {colourError && (
                <div className="mt-1 text-[11px] text-red-600">{colourError}</div>
              )}
            </div>
            <div className="px-3 pb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const parsed = parseColourInput(colourInput);
                  if (!parsed) {
                    setColourError("Enter a valid hex or rgb colour.");
                    return;
                  }
                  if (openMenuId === null) return;
                  void onUpdateCategory(openMenuId, { colour: parsed });
                  setShowPickerMenu(false);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <span className="material-icons text-[14px]">check</span>
                Select
              </button>
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
};

export default CategoryMultiSelect;
