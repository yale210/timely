<<<<<<<< HEAD:frontend/src/components/tasks/TaskListSection.tsx
import { useState } from "react";
import TaskCard from "@/components/tasks/TaskCard";
import { type Task } from "@/types";
========
import TaskListSectionMain from "@/components/tasks/TaskListSection";
import type { Task, Category } from "@/types";
>>>>>>>> 0a59c9fc (refactor(settings): standardize settings layout and reorganize general controls):frontend/src/components/taskList/TaskListSection.tsx

interface TaskListSectionProps {
  title: string;
  tasks: Task[];
<<<<<<<< HEAD:frontend/src/components/tasks/TaskListSection.tsx
========
  categories?: Category[];
>>>>>>>> 0a59c9fc (refactor(settings): standardize settings layout and reorganize general controls):frontend/src/components/taskList/TaskListSection.tsx
  onToggleComplete: (id: number) => void;
  onTaskClick: (task: Task) => void;
  initialVisible?: number;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

<<<<<<<< HEAD:frontend/src/components/tasks/TaskListSection.tsx
/**
 * A functional component that renders a section of tasks with a title.
 * @param props - The properties for the TaskListSection component.
 * @param props.title - The title of the section.
 * @param props.tasks - The list of tasks to display in this section.
 * @param props.onToggleComplete - The callback function to toggle task completion.
 * @param props.onTaskClick - The callback function to handle task clicks.
 * @param props.initialVisible - The initial number of visible tasks.
 * @param props.isCollapsible - Indicates whether the section is collapsible.
 * @param props.defaultCollapsed - Indicates whether the section is collapsed by default.
 * @returns The rendered task list section component.
 */
========
>>>>>>>> 0a59c9fc (refactor(settings): standardize settings layout and reorganize general controls):frontend/src/components/taskList/TaskListSection.tsx
const TaskListSection = ({
  categories: _categories,
  ...props
}: TaskListSectionProps) => <TaskListSectionMain {...props} />;

<<<<<<<< HEAD:frontend/src/components/tasks/TaskListSection.tsx
  const hasMore = tasks.length > visibleCount && !isCollapsed;
  const visibleTasks = isCollapsed ? [] : tasks.slice(0, visibleCount);

  return (
    <div className="mb-8 bg-white">
      <div
        className={`flex items-center justify-between mb-4 ${isCollapsible ? "cursor-pointer select-none" : ""}`}
        onClick={() => isCollapsible && setIsCollapsed((prev) => !prev)}
        role={isCollapsible ? "button" : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyDown={(event) => {
          if (!isCollapsible) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsCollapsed((prev) => !prev);
          }
        }}
        aria-expanded={isCollapsible ? !isCollapsed : undefined}
      >
        <h3 className="text-lg font-semibold text-black flex items-center">
          {isCollapsible && (
            <span
              className={`material-icons text-gray-400 mr-2 transition-transform duration-200 ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            >
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

========
export default TaskListSection;
>>>>>>>> 0a59c9fc (refactor(settings): standardize settings layout and reorganize general controls):frontend/src/components/taskList/TaskListSection.tsx
