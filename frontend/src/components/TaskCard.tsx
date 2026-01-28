import React from "react";
import { type Task } from "../types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onClick: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onClick }) => {
  const isOverdue = new Date(task.deadline) < new Date() && !task.completed;

  // Map importance to priority color
  const getPriorityColor = (importance: number) => {
    if (importance >= 8) return "bg-red-500";
    if (importance >= 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group ${
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
          <div className="ml-4 flex flex-col">
            <div className="flex items-center">
              <span
                className={`text-sm font-medium truncate ${
                  task.completed
                    ? "text-gray-500 line-through"
                    : "text-black"
                }`}
              >
                {task.title}
              </span>
              <span
                className={`ml-3 inline-block h-2 w-2 rounded-full ${getPriorityColor(
                  task.importance
                )}`}
                title={`Importance: ${task.importance}`}
              ></span>
            </div>
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span
                className={`flex items-center ${
                  isOverdue ? "text-red-500" : ""
                }`}
              >
                <span className="material-icons text-sm mr-1">schedule</span>
                {isOverdue ? "Overdue" : formatTime(task.deadline)}
              </span>
              <div className="flex gap-1">
                {task.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100"
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
    </div>
  );
};

export default TaskCard;
