import { useMemo, useState } from "react";
import { Tooltip } from "@/components/ui";

type FeatureKey = "assessments" | "gradebook" | "pomodoro" | "courses";

interface FeatureRow {
  key: FeatureKey;
  label: string;
  description: string;
  value: boolean;
}

const SettingsFeatureSection = () => {
  const [featureFlags, setFeatureFlags] = useState(() => ({
    courses: localStorage.getItem("feature_courses_enabled") !== "false",
    assessments: localStorage.getItem("feature_assessments_enabled") !== "false",
    gradebook: localStorage.getItem("feature_gradebook_enabled") !== "false",
    pomodoro: localStorage.getItem("feature_pomodoro_enabled") !== "false",
  }));

  const featureRows = useMemo<FeatureRow[]>(
    () => [
      {
        key: "pomodoro",
        label: "Pomodoro",
        description:
          "A focus timer that alternates work sessions with short and long breaks.",
        value: featureFlags.pomodoro,
      },
      {
        key: "assessments",
        label: "Assessments",
        description:
          "Track upcoming assessments with optional calendar events and gradebook handoff.",
        value: featureFlags.assessments,
      },
      {
        key: "gradebook",
        label: "Gradebook",
        description: "Track and review your grades over time.",
        value: featureFlags.gradebook,
      },
      {
        key: "courses",
        label: "Courses",
        description:
          "Show course browsing, management, and course details in the app.",
        value: featureFlags.courses,
      },
    ],
    [featureFlags],
  );

  const updateFeature = (key: FeatureKey, value: boolean) => {
    if (key === "assessments") {
      localStorage.setItem("feature_assessments_enabled", String(value));
    } else if (key === "gradebook") {
      localStorage.setItem("feature_gradebook_enabled", String(value));
    } else if (key === "courses") {
      localStorage.setItem("feature_courses_enabled", String(value));
    } else {
      localStorage.setItem("feature_pomodoro_enabled", String(value));
    }
    setFeatureFlags((prev) => ({ ...prev, [key]: value }));
    window.dispatchEvent(new Event("feature-flags-changed"));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Extras</h2>
          <Tooltip content="Optional extra features you can turn on or off in the app.">
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
              aria-label="Explain Extras"
            >
              ?
            </button>
          </Tooltip>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Turn optional app features on or off.
        </p>
      </div>
      <div className="space-y-4">
        {featureRows.map((feature) => (
          <label
            key={feature.key}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
              <p className="mt-1 text-xs text-gray-500">{feature.description}</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={feature.value}
              onChange={(event) => {
                updateFeature(feature.key, event.target.checked);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default SettingsFeatureSection;
