import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { authService } from "../services/authService";
import { useEffect } from "react";
import { preferenceService } from "@/services/preferenceService";
import { type Preference } from "@/types";

/**
 * Basic settings page placeholder.
 * @returns The rendered settings page.
 */
type SettingsSection = "profile" | "preferences" | "theme" | "features";

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const navigate = useNavigate();

  const [pref, setPref] = useState<Preference|null>(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState<string|null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function formatDFRError(error: unknown): {
    message: string;
    fieldErrors: Record<string, string[]>;
  } {
    const fallback = {
      message: "Something went wrong",
      fieldErrors: {} as Record<string, string[]>
    }
    if (!error || typeof error !== "object") { return fallback }
    const anyError = error as any

    const status: number | undefined = anyError?.response?.status
    const data: unknown = anyError?.response?.data

    if (data && typeof data === "object" && typeof (data as any).detail === "string") {
      return {
        message: (data as any).detail,
        fieldErrors: {},
      }
    }

    if (status === 401) {
      return {
        message: "You are not signed in. Please log in again.",
        fieldErrors: {},
      }
    }

    if (!data || typeof data !== "object") { return fallback }
    const field: Record<string, string[]> = {}
    for (const [key, potentialArray] of Object.entries(data as Record<string, unknown>)) {
      if (Array.isArray(potentialArray)) {
        field[key] = potentialArray.filter((x): x is string => typeof x === "string")
      }
    }

    const nonField = field.non_field_errors?.join(" ").trim()
    const firstFieldMessage = Object.entries(field)
      .filter(([k]) => k !== "non_field_errors")
      .flatMap(([, msgs]) => msgs)
      .find(Boolean) ?? "";
    const message =
      nonField ||
      firstFieldMessage ||
      "Please fix the highlighted fields."
    return {
      message,
      fieldErrors: field
    }
  }

  const validatePref = (p: Preference) => {
    const errors: Record<string, string[]> = {};
    const max = p.max_hours_study_per_day
    if (Number.isNaN(max)){
      errors.max_hours_study_per_day=["Must be a number."]
    } else if (max<0) {
      errors.max_hours_study_per_day=["Must be at least 0."]
    } else if (max>24){
      errors.max_hours_study_per_day=["Must be 24 or less."]
    }

    if (!p.day_start){
      errors.day_start=["Required."]
    }
    if (!p.day_end){
      errors.day_end=["Required."]
    }

    return errors;
  }

  useEffect(() => {
    if (activeSection !== "preferences") { return }

    setPrefLoading(true)
    setPrefError(null)
    setFieldErrors({})

    void preferenceService.getMyPreference()
    .then((data: Preference) => setPref(data))
    .catch((error: unknown) => {
      const parsed = formatDFRError(error)
      setPrefError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
    })
    .finally(() => setPrefLoading(false))
  }, [activeSection])

  const renderContent = () => {
    if (activeSection === "preferences") {
      try {
        const dayLabels: Array<[number, string]> = [
          [1, "Mon"],
          [2, "Tue"],
          [3, "Wed"],
          [4, "Thu"],
          [5, "Fri"],
          [6, "Sat"],
          [7, "Sun"],
        ]
        const toggleDayOnOff = (dayId: number) => {
          if (!pref) { return }
          const has = pref.days_off.includes(dayId)
          setPref({
            ...pref,
            days_off: has ? pref.days_off.filter((day) => day !== dayId) : [
              ...pref.days_off,
              dayId,
            ]
          })
        }
        const save = async () => {
          console.log("Save clicked", pref)
          if (!pref) { return }

          const clientErrors=validatePref(pref)
          if (Object.keys(clientErrors).length>0){
            setFieldErrors(clientErrors)
            setPrefError("Please fix the highlighted fields.")
            return;
          }

          setPrefSaving(true)
          setPrefError(null)
          setFieldErrors({})

          try {
            const updated = await preferenceService.updateMyPreference({
              day_start: pref.day_start.slice(0,5),
              day_end: pref.day_end.slice(0,5),
              max_hours_study_per_day: pref.max_hours_study_per_day,
              days_off: pref.days_off,
            })
            setPref(updated)
          } catch (error) {
            const parsed = formatDFRError(error)
            setPrefError(parsed.message)
            setFieldErrors(parsed.fieldErrors)
          } finally {
            setPrefSaving(false);
          }
        }

        return (
          <>
            <h2 className="text-lg font-semibold">Scheduling</h2>
            <p className="mt-2 text-sm text-gray-600">
              Set your day's start and end, and max hours of study time per day.
            </p>

            {prefError && (
              <div className="mt-4 text-sm text-red-700 rounded-md bg-red-50 p-3">
                {prefError}
              </div>
            )}

            {prefLoading && (
              <div className="mt-4 text-sm text-gray-600">
                Loading...
              </div>
            )}

            {!prefLoading && pref && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="pref-day-start" className="block text-sm font-medium text-gray-900">Day start</label>
                    <input
                      id="pref-day-start"
                      type="time"
                      value={pref.day_start?.slice(0,5) ?? "08:00"}
                      onChange={(e) => setPref({
                        ...pref,
                        day_start: e.target.value
                      })}
                      className={`mt-2 bg-white px-3 py-2 block outline outline-1 w-full rounded-md ${
                        fieldErrors.day_start ? "outline-red-300" : "outline-gray-300"
                      } focus: outline-2 focus:outline-turquoise-600`}
                    />
                    {fieldErrors.day_start?.length ? (
                      <div className="mt-1 text-xs text-red-700">
                        {fieldErrors.day_start.join(" ")}
                      </div>
                    ) : null}
                </div>

                <div>
                  <label htmlFor="pref-day-end" className="block text-sm font-medium text-gray-900">Day end</label>
                  <input
                    id="pref-day-end"
                    type="time"
                    value={pref.day_end?.slice(0,5) ?? "22:00"}
                      onChange={(e) => setPref({
                      ...pref,
                      day_end: e.target.value
                    })}
                    className={`mt-2 bg-white px-3 py-2 block outline outline-1 w-full rounded-md ${
                      fieldErrors.day_end ? "outline-red-300" : "outline-gray-300"
                    } focus: outline-2 focus:outline-turquoise-600`}
                  />
                  {fieldErrors.day_end?.length ? (
                    <div className="mt-1 text-xs text-red-700">
                      {fieldErrors.day_end.join(" ")}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="pref-max-hours" className="block text-sm font-medium text-gray-900">Max study hours per day</label>
                  <input
                    id="pref-max-hours"
                    type="number"
                    min={0}
                    max={24}
                    value={pref.max_hours_study_per_day ?? 6}
                    onChange={(e) => setPref({
                      ...pref,
                      max_hours_study_per_day: Number(e.target.value)
                    })}
                    className={`mt-2 bg-white px-3 py-2 block outline outline-1 w-full rounded-md ${
                      fieldErrors.max_hours_study_per_day ? "outline-red-300" : "outline-gray-300"
                    } focus: outline-2 focus:outline-turquoise-600`}
                  />
                  {fieldErrors.max_hours_study_per_day?.length ? (
                    <div className="mt-1 text-xs text-red-700">
                      {fieldErrors.max_hours_study_per_day.join(" ")}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">Days off</div>
                  <div className="mt-2 flex flew-wrap gap-2">
                    {dayLabels.map(([id, label]) => {
                      const selected = pref.days_off.includes(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleDayOnOff(id)}
                          className={`rounded-md px-3 py-2 text-sm font-semibold ring-1 transition ${
                            selected ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
                            : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
                          }`}
                          aria-pressed={selected}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {fieldErrors.days_off?.length ? (
                    <div className="mt-1 text-xs text-red-700">
                      {fieldErrors.days_off.join(" ")}
                    </div>
                  ) : null}
                </div>
              </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void save()}
                disabled={prefSaving}
                className="text-sm font-semibold text-red-600 rounded-md bg-turquoise-600 px-4 py-2
                hover:bg-turquoise-500 disabled:opacity-60"
              >
                {prefSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
          )}
          </>
        )
      } catch (error) {
        return (
          <>
            <h2 className="text-lg font-semibold">Scheduling</h2>
            <p className="mt-2 text-sm text-gray-600">
              Preferences controls will go here.
            </p>
          </>
        );
      }
    }

    if (activeSection === "theme") {
      return (
        <>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="mt-2 text-sm text-gray-600">
            Theme options will go here.
          </p>
        </>
      );
    }

    if (activeSection === "features") {
      return (
        <>
          <h2 className="text-lg font-semibold">Features</h2>
          <p className="mt-2 text-sm text-gray-600">
            Feature toggles will go here.
          </p>
        </>
      );
    }

    return (
      <>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-2 text-sm text-gray-600">
          Profile settings will go here.
        </p>
      </>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white text-black">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account and preferences.
            </p>
          </div>
        </header>
        <main className="p-6">
          <div className="flex gap-6">
            <aside className="w-[10%] min-w-[140px]">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveSection("profile")}
                  className={`w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
                    activeSection === "profile"
                      ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("features")}
                  className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
                    activeSection === "features"
                      ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("preferences")}
                  className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
                    activeSection === "preferences"
                      ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Scheduling
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("theme")}
                  className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
                    activeSection === "theme"
                      ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Theme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void authService
                      .logout()
                      .catch(() => undefined)
                      .finally(() => {
                        navigate("/login");
                      });
                  }}
                  className="mt-6 w-full text-left text-sm font-semibold rounded-md px-3 py-2 text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </aside>
            <section className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {renderContent()}
            </section>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
