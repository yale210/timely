import React, { useState } from "react";
import TaskCard from "./TaskCard";
import { type Task } from "../types";

interface TaskListSectionProps {
  title: string;
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onTaskClick: (task: Task) => void;
  initialVisible?: number;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

const TaskListSection: React.FC<TaskListSectionProps> = ({
  title,
  tasks,
  onToggleComplete,
  onTaskClick,
  initialVisible = 5,
  isCollapsible = false,
  defaultCollapsed = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const hasMore = tasks.length > visibleCount && !isCollapsed;
  const visibleTasks = isCollapsed ? [] : tasks.slice(0, visibleCount);

  return (
    <div className="mb-8 bg-white">
      <div 
        className={`flex items-center justify-between mb-4 ${isCollapsible ? "cursor-pointer select-none" : ""}`}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold text-black flex items-center">
          {isCollapsible && (
            <span className={`material-icons text-gray-400 mr-2 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}>
              expand_more
            </span>
          )}
          {title}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
            {tasks.length}
          </span>
        </h3>
      </div>
      {!isCollapsed && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No tasks in this section.
            </p>
          ) : (
            visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onTaskClick}
              />
            ))
          )}
        </div>
      )}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + initialVisible)}
          className="mt-4 text-sm font-medium text-primary hover:text-blue-300 transition-colors"
        >
          View More
        </button>
      )}
    </div>
  );
};

export default TaskListSection;
