import type { Category } from "@/types";

const DEFAULT_SWATCH = "#94a3b8";

interface CategoryLimitsSectionProps {
  categories: Category[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onLimitChange: (id: number, value: number | null) => void;
  onSave: () => void;
}

/**
 * Renders category-level daily study time limits.
 * @param props - Component props.
 * @returns The category limits settings section.
 */
const CategoryLimitsSection = ({
  categories,
  loading,
  saving,
  error,
  onLimitChange,
  onSave,
}: CategoryLimitsSectionProps) => {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading categories...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Category Limits</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set an optional maximum number of minutes per day for each category when scheduling tasks.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {categories.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          No categories found yet. Create a category from tasks or calendar first.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const colourValue = category.colour ?? DEFAULT_SWATCH;

            return (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full border border-gray-200"
                      style={{ backgroundColor: colourValue }}
                    />
                    <p className="truncate text-sm font-semibold text-gray-900">{category.text}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank for no daily limit.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    step="5"
                    value={category.max_daily_study_time ?? ""}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      onLimitChange(
                        category.id,
                        rawValue === "" ? null : Number(rawValue),
                      );
                    }}
                    className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">mins/day</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading || categories.length === 0}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            saving || loading || categories.length === 0
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-primary text-white hover:bg-blue-300"
          }`}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default CategoryLimitsSection;
