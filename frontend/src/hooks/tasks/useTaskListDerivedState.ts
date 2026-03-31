import { useCallback, useMemo } from "react";
import type { Task } from "@/types";
import { buildTaskSections, formatTaskDayLabel, matchesTaskListFilters } from "@/hooks/tasks/taskListUtils";

interface UseTaskListDerivedStateArgs {
  tasks: Task[];
  search: string;
  filterHighImportance: boolean;
  filterQuickWins: boolean;
}

/**
 * Builds the derived task-list sections and labels from current state.
 * @param args Task-list filtering inputs.
 * @returns Derived sections and date label formatter.
 */
export function useTaskListDerivedState(args: UseTaskListDerivedStateArgs) {
  const filteredTasks = useMemo(() => (
    args.tasks.filter((task) =>
      matchesTaskListFilters(
        task,
        args.search,
        args.filterHighImportance,
        args.filterQuickWins,
      ),
    )
  ), [args.filterHighImportance, args.filterQuickWins, args.search, args.tasks]);

  const sections = useMemo(
    () => buildTaskSections(filteredTasks),
    [filteredTasks],
  );
  const formatDayLabel = useCallback((dateStr: string) => formatTaskDayLabel(dateStr), []);

  return { sections, formatDayLabel };
}
