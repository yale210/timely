import { useMemo, useState } from "react";
import PreferencesSection from "@/components/settings/PreferencesSection";
import OverridesSection from "@/components/settings/OverridesSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ThemeSection from "@/components/settings/ThemeSection";
import ProfileSection from "@/components/settings/ProfileSection";
import CategoryLimitsSection from "@/components/settings/CategoryLimitsSection";
import PrivacySection from "@/components/settings/PrivacySection";
import { Tooltip } from "@/components/ui";
import { useTeacher } from "@/hooks/course/useTeacher";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";
import { useProfileSettings } from "@/hooks/settings/useProfileSettings";
import { makeMyTeacherProfile, unregisterMyTeacherProfile } from "@/services/courseService.ts";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";

interface SettingsContentProps {
  state: Omit<UseSettingsReturn["state"], "isPreferenceDirty" | "areCategoryLimitsDirty"> & {
    isPreferenceDirty?: boolean;
    areCategoryLimitsDirty?: boolean;
  };
  loading: UseSettingsReturn["loading"];
  error: UseSettingsReturn["error"];
  actions: UseSettingsReturn["actions"];
}

const InfoLabel = ({
  label,
  tooltip,
  htmlFor,
}: {
  label: string;
  tooltip?: string;
  htmlFor?: string;
}) => (
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

const formControlClass =
  "mt-2 w-full max-w-[14rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none";

/**
 * Renders the settings page layout and selected section content.
 * @param props - Settings content props.
 * @param props.state - Settings state values.
 * @param props.loading - Settings loading values.
 * @param props.error - Settings error values.
 * @param props.actions - Settings action callbacks.
 * @returns The presentational settings page content.
 */
const SettingsContent = ({
  state,
  loading,
  error,
  actions,
}: SettingsContentProps) => {
  const [featureFlags, setFeatureFlags] = useState(() => ({
    courses: localStorage.getItem("feature_courses_enabled") !== "false",
    assessments: localStorage.getItem("feature_assessments_enabled") !== "false",
    gradebook: localStorage.getItem("feature_gradebook_enabled") !== "false",
    pomodoro: localStorage.getItem("feature_pomodoro_enabled") !== "false",
  }));
  const [makingTeacher, setMakingTeacher] = useState(false);
  const [unregisteringTeacher, setUnregisteringTeacher] = useState(false);
  const [makeTeacherError, setMakeTeacherError] = useState<string | null>(null);
  const [makeTeacherSuccess, setMakeTeacherSuccess] = useState<string | null>(null);
  const teacherState = useTeacher();

  const featureRows = useMemo(() => ([
    {
      key: "pomodoro",
      label: "Pomodoro",
      description: "A focus timer that alternates work sessions with short and long breaks.",
      value: featureFlags.pomodoro,
    },
    {
      key: "assessments",
      label: "Assessments",
      description: "Track upcoming assessments with optional calendar events and gradebook handoff.",
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
      description: "Show course browsing, management, and course details in the app.",
      value: featureFlags.courses,
    },
  ]), [featureFlags]);

  const updateFeature = (
    key: "assessments" | "gradebook" | "pomodoro" | "courses",
    value: boolean,
  ) => {
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

  const makeTeacher = async () => {
    if (makingTeacher) return;

    setMakeTeacherError(null);
    setMakeTeacherSuccess(null);
    setMakingTeacher(true);

    try {
      await makeMyTeacherProfile();
      await teacherState.reload?.();
      setMakeTeacherSuccess("You are now registered as a teacher.");
    } catch (error: unknown) {
      console.error("Failed to create teacher profile:", error);
      setMakeTeacherError("Unable to make you a teacher.");
    } finally {
      setMakingTeacher(false);
    }
  };

  const unregisterTeacher = async () => {
    if (unregisteringTeacher) return;

    setMakeTeacherError(null);
    setMakeTeacherSuccess(null);
    setUnregisteringTeacher(true);

    try {
      await unregisterMyTeacherProfile();
      await teacherState.reload?.();
      setMakeTeacherSuccess("You are no longer registered as a teacher.");
    } catch (error: unknown) {
      console.error("Failed to unregister teacher profile:", error);
      setMakeTeacherError("Unable to unregister you as a teacher.");
    } finally {
      setUnregisteringTeacher(false);
    }
  };

  const profileState = useProfileSettings(state.activeSection === "profile");
  const isWideSection = state.activeSection === "themes" || state.activeSection === "fonts";
  const sectionContentClass = "w-full";
  const categoryLimitMaxMinutes = useMemo(
    () => getSchedulingDayMaxMinutes(state.preference),
    [state.preference],
  );

  return (
    <div className="settings-page min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account and preferences.
          </p>
        </div>
      </header>
      <main className="p-6">
        <div className="flex gap-6">
          <SettingsSidebar
            state={{ activeSection: state.activeSection }}
            loading={{ saving: loading.saving }}
            actions={{
              selectSection: actions.selectSection,
              logout: () => {
                void actions.logout();
              },
            }}
          />
          <section
            className={`min-w-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${
              isWideSection ? "flex-1" : "w-full max-w-2xl"
            }`}
          >
            <div className={sectionContentClass}>
              {state.activeSection === "preferences" ? (
                <PreferencesSection
                  pref={state.preference}
                  prefLoading={loading.preference}
                  prefSaving={loading.saving}
                  prefDirty={state.isPreferenceDirty ?? false}
                  prefError={error.preference}
                  fieldErrors={state.fieldErrors}
                  onPrefChange={actions.setPreference}
                  onSave={() => {
                    void actions.savePreferences();
                  }}
                />
              ) : null}
              {state.activeSection === "overrides" ? <OverridesSection /> : null}
              {state.activeSection === "themes" ? (
                <ThemeSection
                  onThemeChange={actions.applyTheme}
                  onFontChange={actions.applyFont}
                  mode="themes"
                />
              ) : null}
              {state.activeSection === "fonts" ? (
                <ThemeSection
                  onThemeChange={actions.applyTheme}
                  onFontChange={actions.applyFont}
                  mode="fonts"
                />
              ) : null}
              {state.activeSection === "categories" ? (
                <CategoryLimitsSection
                  categories={state.categories}
                  maxDailyMinutes={categoryLimitMaxMinutes}
                  loading={loading.categories}
                  saving={loading.saving}
                  hasChanges={state.areCategoryLimitsDirty ?? false}
                  error={error.categories}
                  onLimitChange={actions.setCategoryLimit}
                  onSave={() => {
                    void actions.saveCategoryLimits();
                  }}
                />
              ) : null}
              {state.activeSection === "features" ? (
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
                            updateFeature(
                              feature.key as "assessments" | "gradebook" | "pomodoro" | "courses",
                              event.target.checked,
                            );
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              {state.activeSection === "general" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">General</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Control app-wide defaults and interaction behaviour.
                    </p>
                  </div>

                  {loading.preference ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : (() => {
                    const preference = state.preference;
                    if (!preference) {
                      return <p className="text-sm text-red-600">Unable to load preferences.</p>;
                    }

                    return (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
                          <InfoLabel
                            label="Sound effects"
                            tooltip="Controls app sound cues such as completion and button click effects."
                          />
                          <div className="mt-2 flex items-center gap-3">
                            <div className="text-xs font-medium text-gray-600">
                              {preference.disable_sound_effects ? "Disabled" : "Enabled"}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                actions.setPreference({
                                  ...preference,
                                  disable_sound_effects: !preference.disable_sound_effects,
                                });
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                preference.disable_sound_effects ? "bg-gray-300" : "bg-primary"
                              }`}
                              aria-pressed={!preference.disable_sound_effects}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                  preference.disable_sound_effects ? "translate-x-1" : "translate-x-4"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
                          <InfoLabel
                            htmlFor="general-default-landing-page"
                            label="Default landing page"
                            tooltip="Choose which page opens first after login."
                          />
                          <select
                            id="general-default-landing-page"
                            value={preference.default_landing_page ?? "dashboard"}
                            onChange={(event) => {
                              actions.setPreference({
                                ...preference,
                                default_landing_page: event.target.value as "dashboard" | "calendar" | "tasks",
                              });
                            }}
                            className={`${formControlClass} ${
                              state.fieldErrors.default_landing_page?.length ? "border-red-300" : ""
                            }`}
                          >
                            <option value="dashboard">Overview</option>
                            <option value="calendar">Calendar</option>
                            <option value="tasks">Tasks</option>
                          </select>
                          {state.fieldErrors.default_landing_page?.length ? (
                            <div className="mt-1 text-xs text-red-700">
                              {state.fieldErrors.default_landing_page.join(" ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
                          <InfoLabel
                            htmlFor="general-week-starts-on"
                            label="Week starts on"
                            tooltip="Choose whether calendar and weekly views start on Monday or Sunday."
                          />
                          <select
                            id="general-week-starts-on"
                            value={preference.week_starts_on ?? "monday"}
                            onChange={(event) => {
                              actions.setPreference({
                                ...preference,
                                week_starts_on: event.target.value as "monday" | "sunday",
                              });
                            }}
                            className={`${formControlClass} ${
                              state.fieldErrors.week_starts_on?.length ? "border-red-300" : ""
                            }`}
                          >
                            <option value="monday">Monday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                          {state.fieldErrors.week_starts_on?.length ? (
                            <div className="mt-1 text-xs text-red-700">
                              {state.fieldErrors.week_starts_on.join(" ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
                          <InfoLabel
                            htmlFor="general-time-format"
                            label="Time format"
                            tooltip="Switch how times are displayed throughout the app."
                          />
                          <select
                            id="general-time-format"
                            value={preference.time_format ?? "24h"}
                            onChange={(event) => {
                              actions.setPreference({
                                ...preference,
                                time_format: event.target.value as "24h" | "12h",
                              });
                            }}
                            className={`${formControlClass} ${
                              state.fieldErrors.time_format?.length ? "border-red-300" : ""
                            }`}
                          >
                            <option value="24h">24-hour</option>
                            <option value="12h">12-hour</option>
                          </select>
                          {state.fieldErrors.time_format?.length ? (
                            <div className="mt-1 text-xs text-red-700">
                              {state.fieldErrors.time_format.join(" ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
                          <InfoLabel
                            htmlFor="general-drag-snap-minutes"
                            label="Calendar drag timeslot"
                            tooltip="Controls how task drag and resize actions snap on the calendar."
                          />
                          <select
                            id="general-drag-snap-minutes"
                            value={preference.drag_snap_minutes}
                            onChange={(event) => {
                              actions.setPreference({
                                ...preference,
                                drag_snap_minutes: Number(event.target.value) as 5 | 10 | 15 | 20 | 30 | 60,
                              });
                            }}
                            className={`${formControlClass} ${
                              state.fieldErrors.drag_snap_minutes?.length ? "border-red-300" : ""
                            }`}
                          >
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={20}>20 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>60 minutes</option>
                          </select>
                          {state.fieldErrors.drag_snap_minutes?.length ? (
                            <div className="mt-1 text-xs text-red-700">
                              {state.fieldErrors.drag_snap_minutes.join(" ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              void actions.savePreferences();
                            }}
                            disabled={loading.saving || !(state.isPreferenceDirty ?? false)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                              loading.saving || !(state.isPreferenceDirty ?? false)
                                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                : "bg-primary text-white hover:bg-blue-300"
                            }`}
                          >
                            {loading.saving ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
              {state.activeSection === "profile" ? (
                <ProfileSection
                  profile={profileState.state.profile}
                  loading={profileState.state.loading}
                  saving={profileState.state.saving}
                  isDirty={profileState.state.isDirty}
                  error={profileState.state.error}
                  fieldErrors={profileState.state.fieldErrors}
                  teacherActionLoading={{
                    makingTeacher,
                    unregisteringTeacher,
                    teacherStatus: teacherState.loading,
                  }}
                  teacherActionState={{
                    error: makeTeacherError,
                    success: makeTeacherSuccess,
                  }}
                  isTeacher={teacherState.isTeacher}
                  onChange={profileState.actions.setProfile}
                  onAvatarChange={profileState.actions.setAvatarFile}
                  onToggleTeacher={(nextValue) => {
                    if (nextValue) {
                      void makeTeacher();
                      return;
                    }

                    void unregisterTeacher();
                  }}
                  onSave={() => {
                    void profileState.actions.saveProfile();
                  }}
                />
              ) : null}
              {state.activeSection === "privacy" ? (
                <PrivacySection
                  deleting={false}
                  onDeleteEvents={() => {
                    return actions.deleteEvents();
                  }}
                  onDeleteTasks={() => {
                    return actions.deleteTasks();
                  }}
                />
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsContent;
