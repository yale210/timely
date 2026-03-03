import AppLayout from "@/layouts/AppLayout";
import { EventSidebar } from "@/components";
import EventListHeader from "@/components/events/EventListHeader";
import EventListToolbar from "@/components/events/EventListToolbar";
import EventPastSection from "@/components/events/EventPastSection";
import EventTodaySection from "@/components/events/EventTodaySection";
import EventUpcomingSection from "@/components/events/EventUpcomingSection";
import { useEventList } from "@/hooks/useEventList";

const EventList = () => {
  const { state, loading, error, actions } = useEventList();
  const { categories, isSidebarOpen, selectedEvent, isPastCollapsed, search, sortBy, filters, sections } = state;

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        <EventListHeader onNewEvent={actions.openNewEvent} />
        <EventListToolbar
          search={search}
          sortBy={sortBy}
          categories={categories}
          filterCategory={filters.category}
          filterRecurring={filters.recurringOnly}
          onSearchChange={actions.setSearch}
          onSortChange={actions.setSortBy}
          onCategoryChange={actions.setFilterCategory}
          onToggleRecurring={actions.toggleRecurringOnly}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && state.events.length === 0 && (
          <p className="mb-4 text-sm text-gray-500">Loading events...</p>
        )}

        <EventPastSection
          pastEvents={sections.pastEvents}
          isCollapsed={isPastCollapsed}
          onToggle={actions.togglePastCollapsed}
          onEventClick={actions.openEvent}
          getInstanceKey={actions.getInstanceKey}
        />

        <EventTodaySection
          todayEvents={sections.todayEvents}
          onEventClick={actions.openEvent}
          getInstanceKey={actions.getInstanceKey}
        />

        <EventUpcomingSection
          upcomingEvents={sections.upcomingEvents}
          groupedUpcomingEvents={sections.groupedUpcomingEvents}
          sortedUpcomingDates={sections.sortedUpcomingDates}
          onEventClick={actions.openEvent}
          formatDayLabel={actions.formatDayLabel}
          getInstanceKey={actions.getInstanceKey}
        />

        <button
          onClick={actions.openNewEvent}
          className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center font-medium"
        >
          <span className="material-icons mr-2">add</span>
          Add New Event
        </button>
      </div>

      <EventSidebar
        isOpen={isSidebarOpen}
        onClose={actions.closeSidebar}
        categories={categories}
        onSubmit={(data, context) => {
          void actions.submitEvent(data, context);
        }}
        onDelete={(context) => {
          void actions.deleteEvent(context);
        }}
        onRevertToSeries={(context) => {
          void actions.revertEvent(context);
        }}
        initialData={selectedEvent}
      />
    </AppLayout>
  );
};

export default EventList;
