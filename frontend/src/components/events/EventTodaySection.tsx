import { EventCard } from "@/components";
import { type Event } from "@/types";

interface EventTodaySectionProps {
  todayEvents: Event[];
  onEventClick: (event: Event) => void;
  getInstanceKey: (event: Event, index: number) => string;
}

const EventTodaySection = ({
  todayEvents,
  onEventClick,
  getInstanceKey,
}: EventTodaySectionProps) => {
  return (
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
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventTodaySection;
