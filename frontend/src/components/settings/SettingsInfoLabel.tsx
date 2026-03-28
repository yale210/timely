import { Tooltip } from "@/components/ui";

interface SettingsInfoLabelProps {
  label: string;
  tooltip?: string;
  htmlFor?: string;
}

const SettingsInfoLabel = ({ label, tooltip, htmlFor }: SettingsInfoLabelProps) => (
  <div className="flex items-center gap-2">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-900">
      {label}
    </label>
    {tooltip ? (
      <Tooltip content={tooltip}>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
          aria-label={`Explain ${label}`}
        >
          ?
        </button>
      </Tooltip>
    ) : null}
  </div>
);

export default SettingsInfoLabel;
