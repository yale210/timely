import { Tooltip } from "@/components";
import type { Category } from "@/types";
import { hexToRgba } from "@/utils/colorUtils";

interface AssessmentCategorySelectProps {
  id: string;
  label: string;
  tooltip: string;
  value: number | "";
  categories: Category[];
  category?: Category;
  inputClassName: string;
  ariaLabel: string;
  onChange: (value: number | "") => void;
}

const AssessmentCategorySelect = ({
  id,
  label,
  tooltip,
  value,
  categories,
  category,
  inputClassName,
  ariaLabel,
  onChange,
}: AssessmentCategorySelectProps) => (
  <div>
    <div className="mb-2 flex items-center gap-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <Tooltip content={tooltip}>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
          aria-label={ariaLabel}
        >
          ?
        </button>
      </Tooltip>
    </div>
    <select
      id={id}
      value={value}
      onChange={(event) => {
        onChange(event.target.value === "" ? "" : Number(event.target.value));
      }}
      className={inputClassName}
      style={category?.colour ? {
        borderColor: category.colour,
        boxShadow: `inset 0 0 0 1px ${hexToRgba(category.colour, 0.2)}`,
      } : undefined}
    >
      <option value="">None</option>
      {categories.map((item) => (
        <option
          key={item.id}
          value={item.id}
          style={item.colour ? { backgroundColor: hexToRgba(item.colour, 0.18) } : undefined}
        >
          {item.text}
        </option>
      ))}
    </select>
  </div>
);

export default AssessmentCategorySelect;
