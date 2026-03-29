import { useState } from "react";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { Tooltip } from "@/components/ui";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";
import * as exportService from "@/services/exportService";
import * as importService from "@/services/importService";

interface SettingsGeneralSectionProps {
  preference: UseSettingsReturn["state"]["preference"];
  loadingPreference: UseSettingsReturn["loading"]["preference"];
  saving: UseSettingsReturn["loading"]["saving"];
  isPreferenceDirty: boolean;
  fieldErrors: UseSettingsReturn["state"]["fieldErrors"];
  onPreferenceChange: UseSettingsReturn["actions"]["setPreference"];
  onSave: UseSettingsReturn["actions"]["savePreferences"];
}

const formControlClass =
  "mt-2 w-full max-w-[14rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none";

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

const saveButtonClass = (saving: boolean, isPreferenceDirty: boolean) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
    saving || !isPreferenceDirty
      ? "cursor-not-allowed bg-gray-200 text-gray-500"
      : "bg-primary text-white hover:bg-blue-300"
  }`;

const outlineButtonClass = (busy: boolean) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
    busy
      ? "cursor-not-allowed bg-gray-200 text-gray-500"
      : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
  }`;

const FieldError = ({ errors }: { errors?: string[] }) =>
  errors?.length ? (
    <div className="mt-1 text-xs text-red-700">{errors.join(" ")}</div>
  ) : null;

const SettingsGeneralSection = ({
  preference,
  loadingPreference,
  saving,
  isPreferenceDirty,
  fieldErrors,
  onPreferenceChange,
  onSave,
}: SettingsGeneralSectionProps) => {
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [calendarDataError, setCalendarDataError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const exportCalendarData = async () => {
    if (isExportingCalendar) return;

    setCalendarDataError(null);
    setIsExportingCalendar(true);
    try {
      const response = await exportService.exportEvents();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "events.txt");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error("Failed to export calendar data:", error);
      setCalendarDataError("Unable to export calendar data.");
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const importCalendarData = async (file: File) => {
    if (isImportingCalendar) return;

    setCalendarDataError(null);
    setIsImportingCalendar(true);
    try {
      const message = await importService.importEvents(file);
      setImportSuccessMessage(message);
    } catch (error: unknown) {
      console.error("Failed to import calendar data:", error);
      setCalendarDataError("Unable to import calendar data.");
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const openImportPicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.files?.[0]) {
        void importCalendarData(target.files[0]);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General</h2>
        <p className="mt-2 text-sm text-gray-600">
          Control app-wide defaults and interaction behaviour.
        </p>
      </div>

      {loadingPreference ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !preference ? (
        <p className="text-sm text-red-600">Unable to load preferences.</p>
      ) : (
        <>
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
                onPreferenceChange({
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
              onPreferenceChange({
                ...preference,
                default_landing_page: event.target.value as
                  | "dashboard"
                  | "calendar"
                  | "tasks",
              });
            }}
            className={`${formControlClass} ${
              fieldErrors.default_landing_page?.length ? "border-red-300" : ""
            }`}
          >
            <option value="dashboard">Overview</option>
            <option value="calendar">Calendar</option>
            <option value="tasks">Tasks</option>
          </select>
          <FieldError errors={fieldErrors.default_landing_page} />
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
              onPreferenceChange({
                ...preference,
                week_starts_on: event.target.value as "monday" | "sunday",
              });
            }}
            className={`${formControlClass} ${
              fieldErrors.week_starts_on?.length ? "border-red-300" : ""
            }`}
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
          <FieldError errors={fieldErrors.week_starts_on} />
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
              onPreferenceChange({
                ...preference,
                time_format: event.target.value as "24h" | "12h",
              });
            }}
            className={`${formControlClass} ${
              fieldErrors.time_format?.length ? "border-red-300" : ""
            }`}
          >
            <option value="24h">24-hour</option>
            <option value="12h">12-hour</option>
          </select>
          <FieldError errors={fieldErrors.time_format} />
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
              onPreferenceChange({
                ...preference,
                drag_snap_minutes: Number(event.target.value) as
                  | 5
                  | 10
                  | 15
                  | 20
                  | 30
                  | 60,
              });
            }}
            className={`${formControlClass} ${
              fieldErrors.drag_snap_minutes?.length ? "border-red-300" : ""
            }`}
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
          <FieldError errors={fieldErrors.drag_snap_minutes} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Calendar data</p>
          <p className="mt-1 text-xs text-gray-500">
            Import or export your calendar events.
          </p>
          {calendarDataError ? (
            <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {calendarDataError}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void exportCalendarData();
              }}
              disabled={isExportingCalendar}
              className={outlineButtonClass(isExportingCalendar)}
            >
              {isExportingCalendar ? "Exporting..." : "Export events"}
            </button>
            <button
              type="button"
              onClick={openImportPicker}
              disabled={isImportingCalendar}
              className={outlineButtonClass(isImportingCalendar)}
            >
              {isImportingCalendar ? "Importing..." : "Import events"}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              void onSave();
            }}
            disabled={saving || !isPreferenceDirty}
            className={saveButtonClass(saving, isPreferenceDirty)}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
        </>
      )}
      <ConfirmationModal
        isOpen={importSuccessMessage !== null}
        onClose={() => setImportSuccessMessage(null)}
        onConfirm={() => {
          importService.pageReloader.reload();
        }}
        title="Import complete"
        message={importSuccessMessage ?? ""}
        confirmText="Reload"
        cancelText="Close"
        tone="success"
      />
    </div>
  );
};

export default SettingsGeneralSection;
