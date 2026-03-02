import { useState, useEffect, useCallback } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import AppLayout from "@/layouts/AppLayout";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import { type Event, type Category, type EventSubmission, type EventMutationContext } from "@/types";
import { EventSidebar, EventCard } from "@/components";
import moment from "moment";

const getEventWindow = () => ({
  start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
  end_date: moment().add(30, "days").format("YYYY-MM-DD"),
});

const getInstanceKey = (event: Event, index: number): string =>
  event.instance_id ?? `${event.id}-${event.start_time}-${index}`;

/**
 * A functional component that renders a list of events, categorised by date.
 * @returns The rendered event list page component.
 */
const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [isPastCollapsed, setIsPastCollapsed] = useState(true);
  const [search, setSearch] = useState("");

  // Sorting and Filtering States
  const [sortBy, setSortBy] = useState<string>("start_time");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterRecurring, setFilterRecurring] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventService.getEvents(getEventWindow());
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
    const savedTheme = localStorage.getItem("theme");    
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      console.log("loaded saved theme")
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);


  useEffect(() => {
    const loadData = async () => {
      await fetchEvents();
      await fetchCategories();
    };
    void loadData();
  }, [fetchEvents, fetchCategories]);

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsSidebarOpen(true);
  };

  const handleSubmitEvent = async (
    data: EventSubmission,
    context?: EventMutationContext,
  ) => {
    try {
      if (selectedEvent?.id) {
        await eventService.updateEvent(selectedEvent.id, data, context);
      } else {
        await eventService.createEvent(data);
      }
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (context?: EventMutationContext) => {
    if (!selectedEvent?.id) return;
    try {
      await eventService.deleteEvent(selectedEvent.id, context);
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevertEvent = async (context: EventMutationContext) => {
    if (!selectedEvent?.id || !context.original_start_time) {
      return;
    }
    try {
      await eventService.revertEventInstance(
        selectedEvent.id,
        context.original_start_time,
      );
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Apply filters and sorting
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchesRecurring = !filterRecurring || Boolean(event.recurrence_interval);
    const matchesCategory =
      !filterCategory || event.categories.some((category) => category.id === filterCategory);
    return matchesSearch && matchesRecurring && matchesCategory;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "start_time") {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const today = moment().startOf("day");
  const pastEvents = sortedEvents.filter((event) => moment(event.start_time).isBefore(today));
  const todayEvents = sortedEvents.filter((event) =>
    moment(event.start_time).isSame(today, "day"),
  );
  const upcomingEvents = sortedEvents.filter(
    (event) =>
      moment(event.start_time).isAfter(today) &&
      !moment(event.start_time).isSame(today, "day"),
  );

  const groupedUpcomingEvents = upcomingEvents.reduce(
    (groups, event) => {
      const date = moment(event.start_time).startOf("day").format("YYYY-MM-DD");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    },
    {} as Record<string, Event[]>,
  );

  const sortedUpcomingDates = Object.keys(groupedUpcomingEvents).sort();

  const formatDayLabel = (dateStr: string) => {
    const date = moment(dateStr);
    const tomorrow = moment().add(1, "day").startOf("day");
    if (date.isSame(tomorrow, "day")) {
      return "Tomorrow";
    }
    return date.format("ddd D MMM");
  };

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">My Events</h2>
            <p className="text-sm text-gray-500 mt-1">Keep track of your scheduled events.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedEvent(undefined);
                setIsSidebarOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors"
            >
              <span className="material-icons text-lg mr-1">add</span>
              New Event
            </button>
          </div>
        </div>
        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-gray-400">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
              placeholder="Search events..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="material-icons text-base mr-1.5">filter_list</span>
                Filter
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
                <div className="p-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Attributes
                  </div>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => setFilterRecurring(!filterRecurring)}
                        className={`${
                          focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                        } ${filterRecurring ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        <span
                          className={`material-icons text-sm mr-2 ${filterRecurring ? "text-orange-500" : "text-gray-400"}`}
                        >
                          {filterRecurring ? "check_box" : "check_box_outline_blank"}
                        </span>
                        Recurring Only
                      </button>
                    )}
                  </MenuItem>
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Category
                  </div>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => setFilterCategory(null)}
                        className={`${
                          focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                        } ${filterCategory === null ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        All Categories
                      </button>
                    )}
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id}>
                      {({ focus }) => (
                        <button
                          onClick={() => setFilterCategory(category.id)}
                          className={`${
                            focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                          } ${filterCategory === category.id ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {category.text}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>

            <Menu as="div" className="relative">
              <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="material-icons text-base mr-1.5">sort</span>
                Sort
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
                <div className="p-1">
                  {[
                    { label: "Date", value: "start_time" },
                    { label: "Title (A-Z)", value: "title" },
                  ].map((option) => (
                    <MenuItem key={option.value}>
                      {({ focus }) => (
                        <button
                          onClick={() => setSortBy(option.value)}
                          className={`${
                            focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                          } ${sortBy === option.value ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {option.label}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {pastEvents.length > 0 ? (
          <div className="mb-8">
            <button
              onClick={() => setIsPastCollapsed(!isPastCollapsed)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <span
                className="material-icons transition-transform"
                style={{ transform: isPastCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
              >
                chevron_right
              </span>
              <h3 className="text-lg font-semibold text-black flex items-center">
                Past Events
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
                  ({pastEvents.length})
                </span>
              </h3>
            </button>
            {!isPastCollapsed && (
              <div className="space-y-3">
                {pastEvents.map((event, index) => (
                  <EventCard
                    key={getInstanceKey(event, index)}
                    event={event}
                    onClick={handleEditEvent}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <button
              onClick={() => setIsPastCollapsed(!isPastCollapsed)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <span
                className="material-icons transition-transform"
                style={{ transform: isPastCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
              >
                chevron_right
              </span>
              <h3 className="text-lg font-semibold text-black flex items-center">
                Past Events
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
                  (0)
                </span>
              </h3>
            </button>
            {!isPastCollapsed && <p className="text-gray-400 italic text-sm">No past events.</p>}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center">
              Today
              <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-xs text-orange-600 font-bold">
                ({todayEvents.length})
              </span>
            </h3>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-gray-400 italic text-sm">No events scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event, index) => (
                <EventCard
                  key={getInstanceKey(event, index)}
                  event={event}
                  onClick={handleEditEvent}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex flex-col mb-4">
            <h3 className="text-lg font-semibold text-black flex items-center">
              Upcoming
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
                ({upcomingEvents.length})
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Events are loaded from the backend for a rolling 60-day window.
            </p>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-6">
              {sortedUpcomingDates.map((date) => (
                <div key={date} className="relative">
                  <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {formatDayLabel(date)}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {groupedUpcomingEvents[date].length}{" "}
                      {groupedUpcomingEvents[date].length === 1 ? "event" : "events"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedUpcomingEvents[date].map((event, index) => (
                      <EventCard
                        key={getInstanceKey(event, index)}
                        event={event}
                        onClick={handleEditEvent}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No upcoming events.</p>
          )}
        </div>

        <button
          onClick={() => {
            setSelectedEvent(undefined);
            setIsSidebarOpen(true);
          }}
          className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center font-medium"
        >
          <span className="material-icons mr-2">add</span>
          Add New Event
        </button>
      </div>

      <EventSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedEvent(undefined);
        }}
        categories={categories}
        onSubmit={(data, context) => {
          void handleSubmitEvent(data, context);
        }}
        onDelete={(context) => {
          void handleDeleteEvent(context);
        }}
        onRevertToSeries={(context) => {
          void handleRevertEvent(context);
        }}
        initialData={selectedEvent}
      />
    </AppLayout>
  );
};

export default EventList;
