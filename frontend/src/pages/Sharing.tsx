import { useMemo, useState, useEffect } from "react";
import { authStore } from "@/services/authService";
import { useSharing } from "@/hooks/sharing/useSharing";
import { getEvents } from "@/services/eventService";
import type { Event } from "@/types";
import AppLayout from "@/layouts/AppLayout";



/**
 * Renders the Sharing page.
 */
export default function Sharing() {
  const user = authStore.getUser();
  const currentUserId = user?.id ?? null;

  const [receiverUsername, setReceiverUsername] = useState("");
  const [eventID, setEventID] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "requests">("events");

  const [events, setEvents] = useState<Event[]>([]);
  
  
  const {
    shares,
    isSharesloading,
    isSharing,
    shareError,
    shareProcessing,
    shareEvent,
    replyShare,
    fetchShares,
  } = useSharing();

  useEffect(() => {
    getEvents()
    .then((data) => {
      setEvents(data)
    } )
    .catch(console.error)
  }, []);


  const { incoming, outgoing } = useMemo(() => {
    const incoming = shares.filter(
      (share) =>
        share.receiver === currentUserId,
    );
    const outgoing = shares.filter(
      (share) =>
        share.sender === currentUserId,
    );
    
    
    return { incoming, outgoing };
  }, [shares, currentUserId]);

  const handleSend = () => {
    const trimmedUser = receiverUsername.trim();
    const trimmedEventID = eventID.trim();
    if (!(trimmedUser && trimmedEventID)) {
      return;
    }
    void shareEvent(trimmedUser, trimmedEventID);
    setReceiverUsername("");
    setEventID("");
  };

  const uniqueEvents = Array.from(
    new Map(events.map(event => [event.id, event])).values()
  );


  return (
    <AppLayout>
      <div className="flex flex-col">

        


        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Event Sharing</h1>
          </div>
        </header>

        <main className="p-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Share an Event</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={receiverUsername}
                  onChange={(event) => setReceiverUsername(event.target.value)}
                  className="h-10 w-40 rounded-md border border-gray-300 px-3 text-sm focus:border-cyan-400 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="EventID"
                  value={eventID}
                  onChange={(event) => setEventID(event.target.value)}
                  className="h-10 w-40 rounded-md border border-gray-300 px-3 text-sm focus:border-cyan-400 focus:outline-none"
                />


                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSharing || !receiverUsername.trim()}
                  className={`h-10 rounded-md px-4 text-sm font-semibold text-white transition-colors ${
                    isSharing || !receiverUsername.trim()
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-cyan-600 hover:bg-cyan-500"
                  }`}
                >
                  {isSharing ? "Sharing..." : "Share Event"}
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
                {(["events", "requests"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab)

                      if (tab == "requests") {
                        void fetchShares();
                      }
                    }}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-cyan-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab === "events" ? "Current Events" : "Share Requests"}
                  </button>
                ))}
              </div>
            </section>

            {shareError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {shareError}
              </div>
            ) : null}

            {activeTab === "events" ? (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Your Events</h2>
                  {events.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No events.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      
                      {uniqueEvents.map((event) => (
                        <li
                          key={event.id}
                          className="relative flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                        >
                          
                          <div className="flex items-center gap-3">
                            
                            <div>
                              <p className="text-sm font-semibold">{event.title}</p>
                              <p className="text-xs text-gray-500">e{event.id}</p>
                              
                            </div>
                          </div>
                          <span className="relative z-10 text-xs font-semibold text-gray-400">Able to Share</span>
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            ) : (
              <>
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Incoming share requests</h2>
                  {isSharesloading ? (
                    <p className="mt-3 text-sm text-gray-500">Loading...</p>
                  ) : incoming.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No incoming share requests.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {incoming.map((share) => (
                        <li
                          key={share.id}
                          className="relative flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
                        >
                
                          <div className="flex items-center gap-3">
                            
                            <div>
                              <p className="text-sm font-semibold">{share.sender_username ?? `User #${share.sender}`}</p>
                              <p className="text-xs text-gray-500">{share.event_title ?? "Request pending"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="relative z-10 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-300"
                              onClick={(event) => {
                                event.stopPropagation();
                                void replyShare(String(share.event_id), "accept", share.id);
                              }}
                              disabled={shareProcessing === (share.id)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="relative z-10 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200"
                              onClick={(event) => {
                                event.stopPropagation();
                                void replyShare(String(share.event_id), "reject", share.id);
                              }}
                              disabled={shareProcessing === (share.id)}
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
                  <h2 className="text-lg font-semibold">Outgoing share requests</h2>
                  {isSharesloading ? (
                    <p className="mt-3 text-sm text-gray-500">Loading...</p>
                  ) : outgoing.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No outgoing share requests.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {outgoing.map((share) => (
                        <li
                          key={share.id}
                          className="relative flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                        >
                          
                          <div className="flex items-center gap-3">
                            
                            <div>
                              <p className="text-sm font-semibold">{share.receiver_username ?? `User #${share.receiver}`}</p>
                              <p className="text-xs text-gray-500">{share.event_title ?? "Request pending"}</p>
                              
                            </div>
                          </div>
                          <span className="relative z-10 text-xs font-semibold text-gray-400">Sent</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                
              </>
            )}
          </div>
        </main>

        
      </div>
    </AppLayout>
  );
}
