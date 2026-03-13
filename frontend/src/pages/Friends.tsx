import { useMemo, useState } from "react";
import { authStore } from "@/services/authService";
import { useFriendships } from "@/hooks/friends/useFriendships";
import AppLayout from "@/layouts/AppLayout";

const renderUserLabel = (userId?: number | null) => {
  if (!userId) return "Unknown user";
  return `User #${userId}`;
};

export default function Friends() {
  const user = authStore.getUser();
  const currentUserId = user?.id ?? null;
  const [receiverId, setReceiverId] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const {
    friendships,
    loading,
    error,
    sending,
    actingIds,
    sendRequest,
    acceptRequest,
    declineRequest,
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
    const numericId = Number(receiverId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return;
    }
    void sendRequest(numericId);
    setReceiverId("");
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
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="User ID"
                  value={receiverId}
                  onChange={(event) => setReceiverId(event.target.value)}
                  className="h-10 w-40 rounded-md border border-gray-300 px-3 text-sm focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !receiverId}
                  className={`h-10 rounded-md px-4 text-sm font-semibold text-white transition-colors ${
                    sending || !receiverId
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-cyan-600 hover:bg-cyan-500"
                  }`}
                >
                  {sending ? "Sending..." : "Send request"}
                </button>
                {currentUserId ? (
                  <span className="text-xs text-gray-500">Signed in as {renderUserLabel(currentUserId)}.</span>
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
                      const friendId = friendship.sender === currentUserId
                        ? friendship.receiver
                        : friendship.sender;
                      return (
                        <li key={friendship.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold">{renderUserLabel(friendId)}</p>
                            <p className="text-xs text-gray-500">Friends</p>
                          </div>
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
                          <div>
                            <p className="text-sm font-semibold">{renderUserLabel(friendship.sender)}</p>
                            <p className="text-xs text-gray-500">Request pending</p>
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
                          <div>
                            <p className="text-sm font-semibold">{renderUserLabel(friendship.receiver)}</p>
                            <p className="text-xs text-gray-500">Waiting for response</p>
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
                        const otherId = friendship.sender === currentUserId
                          ? friendship.receiver
                          : friendship.sender;
                        return (
                          <li key={friendship.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold">{renderUserLabel(otherId)}</p>
                              <p className="text-xs text-gray-500">Declined</p>
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
      </div>
    </AppLayout>
  );
}
