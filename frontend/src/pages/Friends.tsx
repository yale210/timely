import { useMemo, useState } from "react";
import { authStore } from "@/services/authService";
import { useFriendships } from "@/hooks/friends/useFriendships";
import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import type { Friendship } from "@/types";

const getFriendInfo = (friendship: Friendship, currentUserId: number | null) => {
  const isSender = friendship.sender === currentUserId;
  return {
    id: isSender ? friendship.receiver : friendship.sender,
    username: isSender ? friendship.receiver_username_display : friendship.sender_username,
    name: isSender ? friendship.receiver_name : friendship.sender_name,
    avatar: isSender ? friendship.receiver_avatar : friendship.sender_avatar,
  };
};

const renderName = (name?: string | null) => {
  if (!name) return null;
  return name;
};

const getAvatarFallback = (username?: string | null) => {
  if (!username) return "?";
  return username.slice(0, 1).toUpperCase();
};

export default function Friends() {
  const user = authStore.getUser();
  const currentUserId = user?.id ?? null;
  const [receiverUsername, setReceiverUsername] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friendPendingRemoval, setFriendPendingRemoval] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const {
    friendships,
    loading,
    error,
    sending,
    actingIds,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriendships();

  const { incoming, outgoing, accepted, declined } = useMemo(() => {
    const incoming = friendships.filter(
      (friendship) =>
        friendship.state === "SENT" && friendship.receiver === currentUserId,
    );
    const outgoing = friendships.filter(
      (friendship) =>
        friendship.state === "SENT" && friendship.sender === currentUserId,
    );
    const accepted = friendships.filter((friendship) => friendship.state === "ACCEPTED");
    const declined = friendships.filter((friendship) => friendship.state === "DECLINED");
    return { incoming, outgoing, accepted, declined };
  }, [friendships, currentUserId]);

  const handleSend = () => {
    const trimmed = receiverUsername.trim();
    if (!trimmed) {
      return;
    }
    void sendRequest(trimmed);
    setReceiverUsername("");
  };

  const confirmRemove = () => {
    if (!friendPendingRemoval) return;
    void removeFriend(friendPendingRemoval.id);
    setFriendPendingRemoval(null);
  };

  return (
    <AppLayout>
      <div className="flex flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Friends</h1>
          </div>
        </header>

        <main className="p-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Send a friend request</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={receiverUsername}
                  onChange={(event) => setReceiverUsername(event.target.value)}
                  className="h-10 w-40 rounded-md border border-gray-300 px-3 text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !receiverUsername.trim()}
                  className={`h-10 rounded-md px-4 text-sm font-semibold text-white transition-colors ${
                    sending || !receiverUsername.trim()
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-cyan-600 hover:bg-cyan-500"
                  }`}
                >
                  {sending ? "Sending..." : "Send request"}
                </button>
                {currentUserId ? (
                  <span className="text-xs text-gray-500">Signed in as {user?.username ?? "Unknown"}.</span>
                ) : (
                  <span className="text-xs text-red-500">Unable to determine your user id.</span>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
              <div className="flex items-center gap-2">
                {(["friends", "requests"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-cyan-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab === "friends" ? "Friends" : "Requests"}
                  </button>
                ))}
              </div>
            </section>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {activeTab === "friends" ? (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Current friends</h2>
                {loading ? (
                  <p className="mt-3 text-sm text-gray-500">Loading...</p>
                ) : accepted.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No friends yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {accepted.map((friendship) => {
                      const friendInfo = getFriendInfo(friendship, currentUserId);
                      const label = renderName(friendInfo.name) ?? friendInfo.username ?? `User #${friendInfo.id}`;
                      return (
                        <li key={friendship.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
                              {friendInfo.avatar ? (
                                <img src={friendInfo.avatar} alt={label} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
                                  {getAvatarFallback(friendInfo.username)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{friendInfo.username ?? `User #${friendInfo.id}`}</p>
                              <p className="text-xs text-gray-500">{label}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFriendPendingRemoval({
                                id: friendship.id,
                                label,
                              });
                            }}
                            disabled={actingIds.has(friendship.id)}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : (
              <>
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Incoming requests</h2>
                  {loading ? (
                    <p className="mt-3 text-sm text-gray-500">Loading...</p>
                  ) : incoming.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No incoming requests.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {incoming.map((friendship) => (
                        <li key={friendship.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
                              {friendship.sender_avatar ? (
                                <img src={friendship.sender_avatar} alt={friendship.sender_username ?? `User #${friendship.sender}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
                                  {getAvatarFallback(friendship.sender_username)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{friendship.sender_username ?? `User #${friendship.sender}`}</p>
                              <p className="text-xs text-gray-500">{friendship.sender_name ?? "Request pending"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void acceptRequest(friendship.id)}
                              disabled={actingIds.has(friendship.id)}
                              className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => void declineRequest(friendship.id)}
                              disabled={actingIds.has(friendship.id)}
                              className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Outgoing requests</h2>
                  {loading ? (
                    <p className="mt-3 text-sm text-gray-500">Loading...</p>
                  ) : outgoing.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No outgoing requests.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {outgoing.map((friendship) => (
                        <li key={friendship.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
                              {friendship.receiver_avatar ? (
                                <img src={friendship.receiver_avatar} alt={friendship.receiver_username_display ?? `User #${friendship.receiver}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
                                  {getAvatarFallback(friendship.receiver_username_display)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{friendship.receiver_username_display ?? `User #${friendship.receiver}`}</p>
                              <p className="text-xs text-gray-500">{friendship.receiver_name ?? "Waiting for response"}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-400">Sent</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {declined.length > 0 ? (
                  <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Declined</h2>
                    <ul className="mt-4 space-y-3">
                      {declined.map((friendship) => {
                        const friendInfo = getFriendInfo(friendship, currentUserId);
                        const label = renderName(friendInfo.name) ?? friendInfo.username ?? `User #${friendInfo.id}`;
                        return (
                          <li key={friendship.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
                                {friendInfo.avatar ? (
                                  <img src={friendInfo.avatar} alt={label} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
                                    {getAvatarFallback(friendInfo.username)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{friendInfo.username ?? `User #${friendInfo.id}`}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </main>

        <ConfirmationModal
          isOpen={friendPendingRemoval !== null}
          onClose={() => setFriendPendingRemoval(null)}
          onConfirm={confirmRemove}
          title="Remove friend?"
          message={
            friendPendingRemoval
              ? `Are you sure you want to remove ${friendPendingRemoval.label}?`
              : "Are you sure you want to remove this friend?"
          }
          confirmText="Remove"
        />
      </div>
    </AppLayout>
  );
}
