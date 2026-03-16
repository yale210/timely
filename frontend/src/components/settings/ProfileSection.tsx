import type { Profile } from "@/types";

interface ProfileSectionProps {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  onChange: (nextProfile: Profile) => void;
  onSave: () => void;
  onAvatarChange: (file: File | null) => void;
}

const ProfileSection = ({
  profile,
  loading,
  saving,
  error,
  fieldErrors,
  onChange,
  onSave,
  onAvatarChange,
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

      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            saving
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
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
