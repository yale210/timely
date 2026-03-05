import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Category } from "@/types";
import { CategoryActionsMenu } from "@/components/categories/CategoryActionsMenu";
import { CategoryColourPicker } from "@/components/categories/CategoryColourPicker";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";
import { SelectedCategoryChips } from "@/components/categories/SelectedCategoryChips";

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

  const handleMenuOpen = (id: number, target: HTMLButtonElement) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
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
    setOpenMenuId(id);
  };

  const handleTogglePicker = (rect: DOMRect) => {
    setPickerPosition({
      top: rect.top - 280,
      left: rect.left - 280,
    });
    setShowPickerMenu((prev) => !prev);
  };

  const commitColourInput = () => {
    const parsed = parseColourInput(colourInput);
    if (!parsed) {
      setColourError("Enter a valid hex or rgb colour.");
      return;
    }
    setColourInput(parsed);
  };

  const confirmColour = () => {
    const parsed = parseColourInput(colourInput);
    if (!parsed || openMenuId === null) {
      setColourError("Enter a valid hex or rgb colour.");
      return;
    }
    void onUpdateCategory(openMenuId, { colour: parsed });
    setShowPickerMenu(false);
  };

  return (
    <div>
      <SelectedCategoryChips
        selectedCategories={selectedCategories}
        defaultSwatch={DEFAULT_SWATCH}
        onToggle={toggleCategory}
      />

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
      </div>

      <CategoryDropdown
        isOpen={isOpen}
        dropdownPosition={dropdownPosition}
        dropdownMaxHeight={dropdownMaxHeight}
        filtered={filtered}
        selectedIds={selectedIds}
        defaultSwatch={DEFAULT_SWATCH}
        normalizedQuery={normalizedQuery}
        query={query}
        canCreate={canCreate}
        maxCategoryLength={MAX_CATEGORY_LENGTH}
        isCreating={isCreating}
        error={error}
        optionBaseClass={styles.optionBase}
        addBaseClass={styles.addBase}
        onSelectOption={(id) => {
          toggleCategory(id);
          setQuery("");
          setIsOpen(false);
          inputRef.current?.blur();
        }}
        onCreate={() => {
          void handleCreate();
        }}
        onMenuOpen={handleMenuOpen}
      />

      <CategoryActionsMenu
        openMenuId={openMenuId}
        menuPosition={menuPosition}
        menuRef={menuRef}
        menuCategory={menuCategory}
        presetColours={PRESET_COLOURS}
        onDelete={(id) => {
          void handleDelete(id);
        }}
        onUpdate={(id, patch) => {
          void onUpdateCategory(id, patch);
        }}
        onClose={() => {
          setOpenMenuId(null);
          setMenuPosition(null);
        }}
        onTogglePicker={handleTogglePicker}
      />

      <CategoryColourPicker
        isOpen={showPickerMenu}
        position={pickerPosition}
        pickerRef={pickerRef}
        colourInput={colourInput}
        colourError={colourError}
        currentColour={colourInput || menuCategory?.colour || DEFAULT_SWATCH}
        onColourInputChange={setColourInput}
        onColourErrorChange={setColourError}
        onCommitInput={commitColourInput}
        onSelect={confirmColour}
      />
    </div>
  );
};

export default CategoryMultiSelect;
