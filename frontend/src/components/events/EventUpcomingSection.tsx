import { EventCard } from "@/components";
import { type Event } from "@/types";

interface EventUpcomingSectionProps {
  upcomingEvents: Event[];
  groupedUpcomingEvents: Record<string, Event[]>;
  sortedUpcomingDates: string[];
  onEventClick: (event: Event) => void;
  formatDayLabel: (dateStr: string) => string;
  getInstanceKey: (event: Event, index: number) => string;
}

const EventUpcomingSection = ({
  upcomingEvents,
  groupedUpcomingEvents,
  sortedUpcomingDates,
  onEventClick,
  formatDayLabel,
  getInstanceKey,
}: EventUpcomingSectionProps) => {
  return (
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
                  {groupedUpcomingEvents[date].length} {groupedUpcomingEvents[date].length === 1 ? "event" : "events"}
                </span>
              </div>
              <div className="space-y-3">
                {groupedUpcomingEvents[date].map((event, index) => (
                  <EventCard
                    key={getInstanceKey(event, index)}
                    event={event}
                    onClick={onEventClick}
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
  );
};

export default EventUpcomingSection;
