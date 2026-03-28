import { useState } from "react";
import type { Category, Task } from "@/types";
import type { TaskCompletionFilter } from "@/hooks/tasks/taskListTypes";

/**
 * Creates the base state used by the task list domain.
 * @returns Task list state values and setters.
 */
export function useTaskListState() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<TaskCompletionFilter>("all");
  const [filterHighImportance, setFilterHighImportance] = useState(false);
  const [filterQuickWins, setFilterQuickWins] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  return {
    tasks, setTasks, categories, setCategories, loading, setLoading, error, setError,
    warning, setWarning, search, setSearch, sortBy, setSortBy, filterCategory,
    setFilterCategory, filterCompleted, setFilterCompleted, filterHighImportance,
    setFilterHighImportance, filterQuickWins, setFilterQuickWins, isSidebarOpen,
    setIsSidebarOpen, selectedTask, setSelectedTask,
  };
}
