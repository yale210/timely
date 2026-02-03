import { useState } from "react";
import { type Event } from "../types";
import moment from "moment";

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

/**
 * A functional component that renders a card representing a single event.
 * @param props - The properties for the EventCard component.
 * @param props.event - The event object to display.
 * @param props.onClick - The callback function to handle card clicks.
 * @returns The rendered event card component.
 */
const EventCard = ({ event, onClick }: EventCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only dim events from strictly previous days
  const isPast = moment(event.start_time).isBefore(moment().startOf("day"));

  // Map importance to priority color and label
  const getImportanceInfo = (importance: number) => {
    if (importance >= 8) return { label: "High", color: "bg-red-50 text-red-600 border-red-100" };
    if (importance >= 4) return { label: "Medium", color: "bg-amber-50 text-amber-600 border-amber-100" };
    return { label: "Low", color: "bg-green-50 text-green-600 border-green-100" };
  };

  const importanceInfo = getImportanceInfo(event.importance);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={() => onClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group outline-none focus:ring-2 focus:ring-orange-500/20 ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-1 h-10 bg-orange-500 rounded-full mr-4" />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium truncate ${
                  isPast
                    ? "text-gray-500"
                    : "text-black"
                }`}
              >
                {event.title}
              </span>
              
              <div className="flex items-center space-x-2 ml-2">
                {event.recurrence_interval && (
                  <span className="flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold border border-purple-100">
                    <span className="material-icons text-[12px] mr-1">repeat</span>
                    {event.recurrence_interval}
                  </span>
                )}
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 ${importanceInfo.color}`}
                >
                  {isHovered ? event.importance : importanceInfo.label}
                </span>
              </div>
            </div>
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span className="flex items-center">
                <span className="material-icons text-sm mr-1">schedule</span>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </span>
              {event.location && (
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-1">place</span>
                  <span className="truncate max-w-[150px]">{event.location}</span>
                </span>
              )}
              {event.categories && event.categories.length > 0 && (
                <div className="flex gap-1 overflow-hidden">
                  {event.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-medium border border-orange-100 whitespace-nowrap"
                    >
                      {cat.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-gray-400 hover:text-black">
            <span className="material-icons">more_horiz</span>
          </button>
        </div>
      </div>

      {/* Event Description - Shown on hover/focus or when expanded */}
      {(isHovered || isExpanded) && event.description && (
        <div 
          className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 w-full overflow-hidden"
          aria-expanded={isExpanded}
        >
          <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words ${isExpanded ? "" : "line-clamp-2"}`}>
            {event.description}
          </p>
          {event.description.length > 60 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase tracking-wider flex items-center transition-colors"
            >
              {isExpanded ? (
                <>
                  <span className="material-icons text-[12px] mr-1">expand_less</span>
                  Show Less
                </>
              ) : (
                <>
                  <span className="material-icons text-[12px] mr-1">expand_more</span>
                  Show More
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;
