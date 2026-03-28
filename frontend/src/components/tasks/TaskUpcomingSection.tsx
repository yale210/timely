import TaskCard from "@/components/tasks/TaskCard";
import type { Task } from "@/types";

interface TaskUpcomingSectionProps {
    upcomingTasks: Task[];
    groupedUpcomingTasks: Record<string, Task[]>;
    sortedUpcomingDates: string[];
    formatDayLabel: (dateStr: string) => string;
    onTaskClick: (task: Task) => void;
    onToggleComplete: (id: number) => void;
}

/**
 * Renders the grouped upcoming tasks section.
 * @param props The component props.
 * @param props.upcomingTasks The flat list of upcoming tasks.
 * @param props.groupedUpcomingTasks Upcoming tasks grouped by date.
 * @param props.sortedUpcomingDates The ordered list of date keys to render.
 * @param props.formatDayLabel Formats each date heading for display.
 * @param props.onTaskClick Opens a task when its card is clicked.
 * @param props.onToggleComplete Toggles completion for a task by id.
 * @returns The upcoming tasks section, or null when there are no upcoming tasks.
 */
const TaskUpcomingSection = ({
    upcomingTasks,
    groupedUpcomingTasks,
    sortedUpcomingDates,
    formatDayLabel,
    onTaskClick,
    onToggleComplete,
}: TaskUpcomingSectionProps) => {
  if (upcomingTasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold text-black">
          Upcoming
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
            {upcomingTasks.length}
          </span>
        </h3>
      </div>

      <div className="space-y-6">
        {sortedUpcomingDates.map((date) => (
          <div key={date} className="relative">
            <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {formatDayLabel(date)}
              </h4>
              <span className="text-[10px] font-bold text-gray-400">
                {groupedUpcomingTasks[date].length}{" "}
                {groupedUpcomingTasks[date].length === 1 ? "task" : "tasks"}
              </span>
            </div>

            <div className="space-y-3">
              {groupedUpcomingTasks[date].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onClick={onTaskClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskUpcomingSection;