import { type AdminNotificationTarget } from "@/types";

interface AdminBroadcastFormTargetProps {
  target: AdminNotificationTarget;
  targetAudienceCount: number;
  audienceCounts: {
    all: number;
    staff: number;
    admin: number;
    selected_users: number;
  };
  targetOptions: { label: string; value: AdminNotificationTarget }[];
  isSubmitting: boolean;
  onTargetChange: (value: AdminNotificationTarget) => void;
}

/**
 * Renders the target audience selection field for the broadcast form.
 * @param props - Target state and change callbacks.
 * @returns A target selection component.
 */
export const AdminBroadcastFormTarget = (props: AdminBroadcastFormTargetProps) => {
  return (
    <div>
      <label htmlFor="target" className="block text-sm font-medium text-gray-700">
        Target audience
      </label>
      <select
        id="target"
        value={props.target}
        onChange={(event) => props.onTargetChange(event.target.value as AdminNotificationTarget)}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        disabled={props.isSubmitting}
      >
        {props.targetOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value === "all" ? ` (${props.audienceCounts.all})` : ""}
            {option.value === "staff" ? ` (${props.audienceCounts.staff})` : ""}
            {option.value === "admin" ? ` (${props.audienceCounts.admin})` : ""}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">Estimated recipients: {props.targetAudienceCount}</p>
    </div>
  );
};
