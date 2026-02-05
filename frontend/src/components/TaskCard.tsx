import { useState } from "react";
import { type Task } from "../types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
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
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOverdue = new Date(task.deadline) < new Date() && !task.completed;

  // Map importance to priority color and label using ImportanceChoices levels
  const getImportanceInfo = (importance: number) => {
    switch (importance) {
      case 1:
        return { label: "Very low", color: "bg-slate-50 text-slate-500 border-slate-200" };
      case 2:
        return { label: "Low", color: "bg-green-50 text-green-600 border-green-200" };
      case 3:
        return { label: "Low-medium", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case 4:
        return { label: "Medium-low", color: "bg-teal-50 text-teal-600 border-teal-200" };
      case 5:
        return { label: "Medium", color: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case 6:
        return { label: "Medium-high", color: "bg-amber-50 text-amber-600 border-amber-200" };
      case 7:
        return { label: "High-medium", color: "bg-orange-50 text-orange-600 border-orange-200" };
      case 8:
        return { label: "High", color: "bg-rose-50 text-rose-600 border-rose-200" };
      case 9:
        return { label: "Very high", color: "bg-red-50 text-red-600 border-red-200" };
      case 10:
        return { label: "Critical", color: "bg-red-100 text-red-700 border-red-300" };
      default:
        return { label: "Medium", color: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    }
  };

  const importanceInfo = getImportanceInfo(task.importance);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
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
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group outline-none focus:ring-2 focus:ring-primary/20 ${
        task.completed ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.completed}
            onClick={(e) => e.stopPropagation()}
            onChange={() => {
              onToggleComplete(task.id);
            }}
            className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="ml-4 flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium truncate ${
                  task.completed
                    ? "text-gray-500 line-through"
                    : "text-black"
                }`}
              >
                {task.title}
              </span>
              
              <div className="flex items-center space-x-2 ml-2">
                {task.estimated_minutes > 0 && (
                  <span className="flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[10px] font-semibold border border-gray-100">
                    <span className="material-icons text-[12px] mr-1">schedule</span>
                    {task.estimated_minutes}m
                  </span>
                )}
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 ${importanceInfo.color}`}
                >
                  {isHovered ? task.importance : importanceInfo.label}
                </span>
              </div>
            </div>
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span
                className={`flex items-center ${
                  isOverdue ? "text-red-500" : ""
                }`}
              >
                <span className="material-icons text-sm mr-1">event</span>
                {isOverdue ? "Overdue" : formatTime(task.deadline)}
              </span>
              <div className="flex gap-1 overflow-hidden">
                {task.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100 whitespace-nowrap"
                  >
                    {cat.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-gray-400 hover:text-black">
            <span className="material-icons">more_horiz</span>
          </button>
        </div>
      </div>

      {/* Task Description - Shown on hover/focus or when expanded */}
      {(isHovered || isExpanded) && task.description && (
        <div 
          className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 w-full overflow-hidden"
          aria-expanded={isExpanded}
        >
          <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words ${isExpanded ? "" : "line-clamp-2"}`}>
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
