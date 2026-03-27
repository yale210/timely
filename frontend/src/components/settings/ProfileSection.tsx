import { Tooltip } from "@/components/ui";
import type { Profile } from "@/types";

interface ProfileSectionProps {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  isDirty?: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  teacherActionLoading?: {
    makingTeacher: boolean;
    unregisteringTeacher: boolean;
    teacherStatus: boolean;
  };
  teacherActionState?: {
    error: string | null;
    success: string | null;
  };
  isTeacher?: boolean;
  onChange: (nextProfile: Profile) => void;
  onSave: () => void;
  onAvatarChange: (file: File | null) => void;
  onToggleTeacher?: (nextValue: boolean) => void;
}

const ProfileSection = ({
  profile,
  loading,
  saving,
  isDirty = false,
  error,
  fieldErrors,
  teacherActionLoading = {
    makingTeacher: false,
    unregisteringTeacher: false,
    teacherStatus: false,
  },
  teacherActionState = {
    error: null,
    success: null,
  },
  isTeacher = false,
  onChange,
  onSave,
  onAvatarChange,
  onToggleTeacher = () => {},
}: ProfileSectionProps) => {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-red-600">Unable to load profile.</p>;
  }

  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const today = new Date();
  const maxDateOfBirth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Update your public profile details.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-white">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
                No avatar
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onAvatarChange(event.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-300"
            />
            {fieldErrors.avatar && (
              <span className="text-xs text-red-600">{fieldErrors.avatar.join(" ")}</span>
            )}
          </div>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-gray-800">Name</span>
          <input
            type="text"
            value={profile.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
          {fieldErrors.name && (
            <span className="text-xs text-red-600">{fieldErrors.name.join(" ")}</span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-gray-800">Date of birth</span>
          <input
            type="date"
            max={maxDateOfBirth}
            value={profile.date_of_birth ?? ""}
            onChange={(event) =>
              updateField("date_of_birth", event.target.value || null)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
          {fieldErrors.date_of_birth && (
            <span className="text-xs text-red-600">{fieldErrors.date_of_birth.join(" ")}</span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-gray-800">Bio</span>
          <textarea
            rows={4}
            value={profile.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
          {fieldErrors.bio && (
            <span className="text-xs text-red-600">{fieldErrors.bio.join(" ")}</span>
          )}
        </label>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Teacher profile</h3>
            <Tooltip content="Manage whether your account is registered as a teacher.">
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                aria-label="Explain teacher profile"
              >
                ?
              </button>
            </Tooltip>
          </div>

          {teacherActionState.error ? (
            <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {teacherActionState.error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-gray-600">
                {teacherActionLoading.teacherStatus
                  ? "Checking status"
                  : isTeacher
                    ? "Registered"
                    : "Not registered"}
              </div>
              <button
                type="button"
                onClick={() => onToggleTeacher(!isTeacher)}
                disabled={
                  teacherActionLoading.teacherStatus
                  || teacherActionLoading.makingTeacher
                  || teacherActionLoading.unregisteringTeacher
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isTeacher ? "bg-primary" : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                aria-pressed={isTeacher}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    isTeacher ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isDirty}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            saving || !isDirty
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

export default ProfileSection;
