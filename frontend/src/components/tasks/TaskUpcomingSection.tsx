import TaskCard from "@/components/tasks/TaskCard";
import { type Task } from "@/types";

interface TaskUpcomingSectionProps {
  upcomingTasks: Task[];
  groupedUpcomingTasks: Record<string, Task[]>;
  sortedUpcomingDates: string[];
  formatDayLabel: (dateStr: string) => string;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (id: number) => void;
}

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black flex items-center">
          Upcoming
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
            {upcomingTasks.length}
          </span>
        </h3>
      </div>
      <div className="space-y-6">
        {sortedUpcomingDates.map((date) => (
          <div key={date} className="relative">
            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {formatDayLabel(date)}
              </h4>
              <span className="text-[10px] text-gray-400 font-bold">
                {groupedUpcomingTasks[date].length} {groupedUpcomingTasks[date].length === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div className="space-y-3">
              {groupedUpcomingTasks[date].map((task) => (
                <TaskCard key={task.id} task={task} onToggleComplete={onToggleComplete} onClick={onTaskClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskUpcomingSection;
