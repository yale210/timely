import { Tooltip } from "@/components/ui";
import type { Category } from "@/types";

const DEFAULT_SWATCH = "#94a3b8";

interface CategoryLimitsSectionProps {
  categories: Category[];
  maxDailyMinutes: number;
  loading: boolean;
  saving: boolean;
  hasChanges?: boolean;
  error: string | null;
  onLimitChange: (id: number, value: number | null) => void;
  onSave: () => void;
}

/**
 * Renders category-level daily study time limits.
 * @param props - Component props.
 * @param props.categories - Categories that can have per-day scheduling limits.
 * @param props.maxDailyMinutes - Maximum number of schedulable minutes allowed in a day.
 * @param props.loading - Whether category data is still being loaded.
 * @param props.saving - Whether a save request is currently in progress.
 * @param props.error - Error message to show when saving fails.
 * @param props.onLimitChange - Callback that updates a category's local daily limit value.
 * @param props.onSave - Callback that persists the current category limits.
 * @returns The category limits settings section.
 */
const CategoryLimitsSection = ({
  categories,
  maxDailyMinutes,
  loading,
  saving,
  hasChanges = false,
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
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Category Limits</h2>
          <Tooltip content="Set an optional maximum number of minutes per day for each category when scheduling tasks.">
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
              aria-label="Explain category limits"
            >
              ?
            </button>
          </Tooltip>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Limits cannot exceed your current daily scheduling maximum of {maxDailyMinutes} minutes.
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
                    max={maxDailyMinutes}
                    step="5"
                    value={category.max_daily_study_time ?? ""}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      onLimitChange(
                        category.id,
                        rawValue === "" ? null : Math.min(Number(rawValue), maxDailyMinutes),
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
          disabled={saving || loading || categories.length === 0 || !hasChanges}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            saving || loading || categories.length === 0 || !hasChanges
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
