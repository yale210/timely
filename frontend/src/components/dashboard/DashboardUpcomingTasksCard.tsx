import { Link } from "react-router-dom";
import {
  formatDueDate,
  getImportanceLabel,
  MAX_UPCOMING_TASKS,
  UPCOMING_TASK_ROW_GAP,
  UPCOMING_TASK_ROW_HEIGHT,
} from "@/components/dashboard/dashboardOverviewUtils";
import type { Task } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

interface DashboardUpcomingTasksCardProps {
  tasks: Task[];
  checkedOverrides: Record<number, boolean | undefined>;
  periodLabel: string;
  onToggleTask: (task: Task, nextChecked: boolean) => void;
}

/**
 * Renders the upcoming-task checklist shown beside the dashboard calendar.
 * @param props - Task rows, optimistic state, and toggle handler.
 * @param props.tasks - Upcoming tasks to display.
 * @param props.checkedOverrides - Optimistic completion state keyed by task id.
 * @param props.periodLabel - Empty-state period label for the card.
 * @param props.onToggleTask - Handler for toggling a task from the checklist.
 * @returns The upcoming tasks card.
 */
export default function DashboardUpcomingTasksCard({
  tasks,
  checkedOverrides,
  periodLabel,
  onToggleTask,
}: DashboardUpcomingTasksCardProps) {
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-gray-900">Upcoming Tasks</p>
        <Link to="/tasks" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          See all
        </Link>
      </div>
      <ul
        className="mt-4 flex flex-col gap-3 overflow-hidden text-base text-gray-900"
        style={{
          height: `calc(${MAX_UPCOMING_TASKS} * ${UPCOMING_TASK_ROW_HEIGHT}px + ${MAX_UPCOMING_TASKS - 1} * ${UPCOMING_TASK_ROW_GAP}px)`,
        }}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const isChecked = checkedOverrides[task.id] ?? task.completed;
            const overrideColour = getOverrideColour(task.categories);
            const baseColour = overrideColour ?? "#3b82f6";
            const backgroundColour = overrideColour
              ? hexToRgba(baseColour, 0.12)
              : hexToRgba(baseColour, 0.08);

            return (
              <li
                key={task.id}
                className="flex h-[52px] items-center gap-3 rounded-md border px-3"
                style={{
                  borderColor: baseColour,
                  backgroundColor: backgroundColour,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
                }}
              >
                <label
                  className="flex h-full w-full cursor-pointer items-center gap-3"
                  htmlFor={`upcoming-task-${task.id}`}
                >
                  <input
                    id={`upcoming-task-${task.id}`}
                    type="checkbox"
                    className="task-circle-checkbox text-cyan-600"
                    checked={isChecked}
                    onChange={(event) => {
                      void onToggleTask(task, event.target.checked);
                    }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={`truncate text-base font-medium leading-6 ${isChecked ? "text-gray-400 line-through" : "text-gray-900"}`}
                    >
                      {task.title}
                    </span>
                    <span className="mt-0 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="material-icons mr-1" style={{ fontSize: "22px" }}>
                          event
                        </span>
                        {formatDueDate(task.deadline)}
                      </span>
                      <span className="flex items-center text-xs text-gray-500">
                        <span className="material-icons mr-1" style={{ fontSize: "22px" }}>
                          schedule
                        </span>
                        {task.estimated_minutes}m
                      </span>
                      <span className="flex items-center text-xs text-gray-500">
                        <span className="material-icons mr-1" style={{ fontSize: "22px" }}>
                          priority_high
                        </span>
                        {getImportanceLabel(task.importance)}
                      </span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        ) : (
          <li className="flex h-full items-center justify-center text-lg text-gray-400">
            No Upcoming Tasks {periodLabel}
          </li>
        )}
      </ul>
    </div>
  );
}
