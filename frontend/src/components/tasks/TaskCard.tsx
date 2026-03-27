import { useEffect, useRef, useState } from "react";
import { type Task } from "@/types";
import { hexToRgba } from "@/utils/colorUtils";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import { formatDateTimeInTimezone, useUserTimezone } from "@/utils/userTimezone";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => Promise<void> | void;
  onClick: (task: Task) => void;
}

/**
 * A functional component that renders a card representing a single task.
 * @param props - The properties for the TaskCard component.
 * @param props.task - The task object to display.
 * @param props.onToggleComplete - The callback function to toggle task completion.
 * @param props.onClick - The callback function to handle card clicks.
 * @returns The rendered task card component.
 */
const TaskCard = ({ task, onToggleComplete, onClick }: TaskCardProps) => {
  useUserTimezone();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const startTimeMs = new Date(task.start_time).getTime();
  const deadlineMs = new Date(task.deadline).getTime();
  const isNotStarted = !task.completed && startTimeMs > currentTime;
  const isOverdue = deadlineMs < currentTime && !task.completed;
  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const playCompleteSound = () => {
    if (!completeSoundRef.current) return;
    if (typeof window !== "undefined" && localStorage.getItem("disable_sound_effects") === "true") {
      return;
    }
    completeSoundRef.current.currentTime = 0;
    void completeSoundRef.current.play().catch(() => undefined);
  };

  // Map importance to priority colour and label using ImportanceChoices levels
  const getImportanceInfo = (importance: number) => {
    switch (importance) {
      case 1:
        return { label: "Very low", colour: "bg-slate-50 text-slate-500 border-slate-200" };
      case 2:
        return { label: "Low", colour: "bg-green-50 text-green-600 border-green-200" };
      case 3:
        return { label: "Low-medium", colour: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case 4:
        return { label: "Medium-low", colour: "bg-teal-50 text-teal-600 border-teal-200" };
      case 5:
        return { label: "Medium", colour: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case 6:
        return { label: "Medium-high", colour: "bg-amber-50 text-amber-600 border-amber-200" };
      case 7:
        return { label: "High-medium", colour: "bg-orange-50 text-orange-600 border-orange-200" };
      case 8:
        return { label: "High", colour: "bg-rose-50 text-rose-600 border-rose-200" };
      case 9:
        return { label: "Very high", colour: "bg-red-50 text-red-600 border-red-200" };
      case 10:
        return { label: "Critical", colour: "bg-red-100 text-red-700 border-red-300" };
      default:
        return { label: "Medium", colour: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    }
  };

  const importanceInfo = getImportanceInfo(task.importance);

  const getCountdownLabel = (value: string, nowMs: number, prefix?: string): string | null => {
    if (task.completed) {
      return null;
    }

    const targetTime = new Date(value).getTime();
    const diffMs = targetTime - nowMs;
    if (diffMs <= 0) {
      return prefix ? "Now" : "Overdue";
    }

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 1) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return prefix ? `${prefix} ${diffHours}h` : `${diffHours}h left`;
    }

    return prefix ? `${prefix} ${Math.ceil(diffDays)}d` : `${Math.ceil(diffDays)}d left`;
  };

  const getCountdownTone = (value: string, nowMs: number) => {
    const diffMs = new Date(value).getTime() - nowMs;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return "border-red-200 bg-red-50 text-red-700";
    }
    if (diffDays < 3) {
      return "border-orange-200 bg-orange-50 text-orange-700";
    }
    if (diffDays < 7) {
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    return "border-gray-200 bg-gray-50 text-gray-700";
  };

  const countdownTarget = isNotStarted ? task.start_time : task.deadline;
  const countdownLabel = getCountdownLabel(
    countdownTarget,
    currentTime,
    isNotStarted ? "Starts in" : undefined,
  );
  const countdownTone = isNotStarted
    ? "border-gray-200 bg-gray-50 text-gray-700"
    : getCountdownTone(countdownTarget, currentTime);

  const formatDue = (isoString: string) => {
    return formatDateTimeInTimezone(isoString, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={() => onClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      className={`relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group outline-none focus:ring-2 focus:ring-primary/20 ${
        task.completed ? "opacity-75" : ""
      }`}
    >
      {countdownLabel ? (
        <div className="absolute right-4 top-4">
          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${countdownTone}`}>
            {countdownLabel}
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-3 pr-20">
            <input
              type="checkbox"
              checked={task.completed}
              onClick={(e) => e.stopPropagation()}
              onChange={() => {
                if (!task.completed) {
                  playCompleteSound();
                }

                void Promise.resolve(onToggleComplete(task.id));
              }}
              className="task-circle-checkbox text-cyan-600 focus:ring-cyan-400"
            />
            <span
              className={`text-sm font-medium truncate ${
                task.completed
                  ? "text-gray-500 line-through"
                  : "text-black"
              }`}
            >
              {task.title}
            </span>
            {task.categories.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1 overflow-hidden">
                {task.categories.map((cat) => {
                  const chipColour = cat.colour ?? "#94a3b8";
                  return (
                    <span
                      key={cat.id}
                      className="px-2 py-0.5 rounded font-medium border whitespace-nowrap text-xs text-black"
                      style={
                        {
                          borderColor: chipColour,
                          backgroundColor: hexToRgba(chipColour, 0.12),
                        }
                      }
                    >
                      {cat.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span
              className={`flex items-center ${
                isOverdue ? "text-red-500" : ""
              }`}
            >
              <span className="material-icons text-sm mr-1">event</span>
              {isOverdue ? "Overdue" : formatDue(task.deadline)}
            </span>
            {task.estimated_minutes > 0 && (
              <span className="flex items-center text-xs text-gray-500">
                <span className="material-icons mr-1" style={{ fontSize: "22px" }}>schedule</span>
                {task.estimated_minutes}m
              </span>
            )}
            <span className="flex items-center text-xs text-gray-500">
              <span className="material-icons mr-1" style={{ fontSize: "22px" }}>priority_high</span>
              {isHovered ? task.importance : importanceInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Task Description - Shown on hover/focus or when expanded */}
      {(isHovered || isExpanded) && task.description && (
        <div 
          className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 w-full overflow-hidden"
          aria-expanded={isExpanded}
        >
          <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap wrap-break-word ${isExpanded ? "" : "line-clamp-2"}`}>
            {task.description}
          </p>
          {task.description.length > 60 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 text-[10px] font-bold text-primary hover:text-blue-400 uppercase tracking-wider flex items-center transition-colors"
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

export default TaskCard;
