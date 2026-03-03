import { EventCard } from "@/components";
import { type Event } from "@/types";

interface EventPastSectionProps {
  pastEvents: Event[];
  isCollapsed: boolean;
  onToggle: () => void;
  onEventClick: (event: Event) => void;
  getInstanceKey: (event: Event, index: number) => string;
}

const EventPastSection = ({
  pastEvents,
  isCollapsed,
  onToggle,
  onEventClick,
  getInstanceKey,
}: EventPastSectionProps) => {
  return (
    <div className="mb-8">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <span
          className="material-icons transition-transform"
          style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
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

      {!isCollapsed &&
        (pastEvents.length > 0 ? (
          <div className="space-y-3">
            {pastEvents.map((event, index) => (
              <EventCard
                key={getInstanceKey(event, index)}
                event={event}
                onClick={onEventClick}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">No past events.</p>
        ))}
    </div>
  );
};

export default EventPastSection;
