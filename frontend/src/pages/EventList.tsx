import { useState, useEffect, useCallback } from "react";
import AppLayout from "../layouts/AppLayout";
import * as eventService from "../services/eventService";
import * as taskService from "../services/taskService";
import { type Event, type Category, type EventSubmission } from "../types";
import { UnifiedSidebar } from "../components";
import moment from "moment";

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [isPastCollapsed, setIsPastCollapsed] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await taskService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
    void fetchCategories();
  }, [fetchEvents, fetchCategories]);

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsSidebarOpen(true);
  };

  const handleSubmitEvent = async (data: EventSubmission) => {
    try {
      if (selectedEvent?.id) {
        await eventService.updateEvent(selectedEvent.id, data);
      } else {
        await eventService.createEvent(data);
      }
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    try {
      await eventService.deleteEvent(selectedEvent.id);
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const today = moment().startOf("day");

  const pastEvents = events.filter((e) => moment(e.start_time).isBefore(today));
  const todayEvents = events.filter((e) => moment(e.start_time).isSame(today, "day"));
  const upcomingEvents = events.filter((e) => moment(e.start_time).isAfter(today) && !moment(e.start_time).isSame(today, "day"));

  const EventItem = ({ event }: { event: Event }) => (
    <div
      onClick={() => handleEditEvent(event)}
      className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
    >
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 bg-orange-500 rounded-full"></div>
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <span className="material-icons text-xs">schedule</span>
              {moment(event.start_time).format("HH:mm")} - {moment(event.end_time).format("HH:mm")}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <span className="material-icons text-xs">place</span>
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs font-medium px-2 py-1 bg-orange-50 text-orange-600 rounded-md border border-orange-100">
          {moment(event.start_time).format("MMM D")}
        </span>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events</h1>
          <button
            onClick={() => {
              setSelectedEvent(undefined);
              setIsSidebarOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all flex items-center gap-2"
          >
            <span className="material-icons">add</span>
            New Event
          </button>
        </div>

        {/* Past Events */}
        <section>
          <button
            onClick={() => setIsPastCollapsed(!isPastCollapsed)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <span className="material-icons transition-transform" style={{ transform: isPastCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
              chevron_right
            </span>
            <h2 className="text-lg font-bold uppercase tracking-wider">Past Events ({pastEvents.length})</h2>
          </button>
          {!isPastCollapsed && (
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
              {pastEvents.length === 0 && <p className="text-gray-400 italic ml-8">No past events.</p>}
            </div>
          )}
        </section>

        {/* Today's Events */}
        <section>
          <h2 className="text-lg font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Today
          </h2>
          <div className="grid gap-4">
            {todayEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
            {todayEvents.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <p className="text-gray-400">No events scheduled for today.</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-4">Upcoming</h2>
          <div className="grid gap-4">
            {upcomingEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
            {upcomingEvents.length === 0 && <p className="text-gray-400 italic">No upcoming events.</p>}
          </div>
        </section>

        <UnifiedSidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSelectedEvent(undefined);
          }}
          initialMode="event"
          categories={categories}
          initialData={selectedEvent}
          onSubmitTask={() => {}} // Not used in this page
          onSubmitEvent={handleSubmitEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    </AppLayout>
  );
};

export default EventList;
