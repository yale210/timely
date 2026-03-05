import { useMemo, useState, type KeyboardEvent } from "react";
import type { Category } from "@/types";

type CategoryVariant = "task" | "event";

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onCreateCategory: (text: string) => Promise<Category>;
  variant: CategoryVariant;
}

const MAX_CATEGORY_LENGTH = 20;

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
  variant,
}: CategoryMultiSelectProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    window.setTimeout(() => setIsOpen(false), 120);
  };

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
                return (
                  <button
                    key={category.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      toggleCategory(category.id);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm ${isSelected ? styles.optionSelected : styles.optionBase}`}
                  >
                    <span>{category.text}</span>
                    {isSelected && (
                      <span className="material-icons text-base">check</span>
                    )}
                  </button>
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
    </div>
  );
};

export default CategoryMultiSelect;
