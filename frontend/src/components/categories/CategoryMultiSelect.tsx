import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CategoryActionsMenu } from "@/components/categories/CategoryActionsMenu";
import { CategoryColourPicker } from "@/components/categories/CategoryColourPicker";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";
import { SelectedCategoryChips } from "@/components/categories/SelectedCategoryChips";
import {
  DEFAULT_SWATCH,
  MAX_CATEGORY_LENGTH,
  PRESET_COLOURS,
  VARIANT_STYLES,
} from "./CategoryMultiSelect.constants";
import type {
  CategoryMultiSelectProps,
  DropdownPosition,
  FloatingPosition,
} from "./CategoryMultiSelect.types";
import {
  fitFloatingPosition,
  getDropdownLayout,
  getMenuPosition,
  getPickerPosition,
  getRandomPresetColour,
  normalise,
  parseColourInput,
} from "./CategoryMultiSelect.utils";

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
  const [menuPosition, setMenuPosition] = useState<FloatingPosition | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number>(224);
  const [colourInput, setColourInput] = useState("");
  const [colourError, setColourError] = useState<string | null>(null);
  const [showPickerMenu, setShowPickerMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<FloatingPosition | null>(
    null,
  );

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
      if (!created.colour) {
        const randomPreset = getRandomPresetColour(PRESET_COLOURS);
        await onUpdateCategory(created.id, { colour: randomPreset });
      }
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
    const nextLayout = getDropdownLayout(inputRef.current);
    if (!nextLayout) {
      return;
    }

    setDropdownMaxHeight(nextLayout.maxHeight);
    setDropdownPosition(nextLayout.position);
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
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  useEffect(() => {
    if (openMenuId === null || !menuRef.current || !menuPosition) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      const rect = menuRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const nextPosition = fitFloatingPosition(menuPosition, rect);

      if (
        nextPosition.left !== menuPosition.left ||
        nextPosition.top !== menuPosition.top
      ) {
        setMenuPosition(nextPosition);
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
      if (!rect) {
        return;
      }

      const nextPosition = fitFloatingPosition(pickerPosition, rect);

      if (
        nextPosition.left !== pickerPosition.left ||
        nextPosition.top !== pickerPosition.top
      ) {
        setPickerPosition(nextPosition);
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
      if (inputRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
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
    setMenuPosition(getMenuPosition(target));
    setOpenMenuId(id);
  };

  const handleTogglePicker = (rect: DOMRect) => {
    setPickerPosition(getPickerPosition(rect));
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
        currentColour={
          colourInput.length > 0
            ? colourInput
            : menuCategory?.colour ?? DEFAULT_SWATCH
        }
        onColourInputChange={setColourInput}
        onColourErrorChange={setColourError}
        onCommitInput={commitColourInput}
        onSelect={confirmColour}
      />
    </div>
  );
};

export default CategoryMultiSelect;
