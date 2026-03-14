import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { usePublicProfile } from "@/hooks/profiles/usePublicProfile";

const avatarFallback = (username?: string | null) => {
  if (!username) return "?";
  return username.slice(0, 1).toUpperCase();
};

export default function ProfilePage() {
  const { username } = useParams();
  const resolvedUsername = username ?? null;
  const { profile, loading, error } = usePublicProfile(resolvedUsername);

  const displayName = useMemo(() => {
    if (!profile) return "";
    return profile.name?.trim() ? profile.name : profile.username;
  }, [profile]);

  const joinedDate = useMemo(() => {
    if (!profile?.joined_at) return null;
    const date = new Date(profile.joined_at);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [profile]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <Link to="/friends" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
            Back to friends
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : profile ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-gray-200 bg-white">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-500">
                    {avatarFallback(profile.username)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {joinedDate && (
                  <p className="mt-1 text-xs text-gray-400">Joined {joinedDate}</p>
                )}
                <p className="mt-3 text-sm text-gray-600">
                  {profile.bio?.trim() ? profile.bio : "This user has not added a bio yet."}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Profile not found.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
