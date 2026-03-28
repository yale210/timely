import { useCallback } from "react";
import type { Category, Task, TaskSubmission } from "@/types";
import {
    makeToggleComplete,
    makeSubmitTask,
    makeDeleteTask,
    makeUpdateTaskCategories
} from "@/hooks/taskForm/taskMutationActions";

interface UseTaskMutationArgs {
    tasks: Task[];
    categories: Category[];
    selectedTask: Task | undefined;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
    fetchTasks: () => Promise<void>;
}

/**
 * Builds task mutation handlers used by task views.
 * @param args Hook arguments.
 * @param args.tasks The current task list.
 * @param args.categories The available categories.
 * @param args.selectedTask The currently selected task.
 * @param args.setTasks Updates the task list state.
 * @param args.setSelectedTask Updates the selected task state.
 * @param args.fetchTasks Refreshes tasks from the server.
 */
export function useTaskMutations(args: UseTaskMutationArgs) {
    const {
        tasks,
        categories,
        selectedTask,
        setTasks,
        setSelectedTask,
        fetchTasks,
    } = args;
    const toggleComplete = useCallback(async (id: number) => {
        await makeToggleComplete(tasks, fetchTasks)(id);
    }, [tasks, fetchTasks]);
    const submitTask = useCallback(async (data : TaskSubmission) => {
        return makeSubmitTask(selectedTask, fetchTasks)(data);
    }, [selectedTask, fetchTasks]);
    const deleteTask = useCallback(async (id: number) => {
        await makeDeleteTask(fetchTasks)(id);
    }, [fetchTasks]);
    const updateTaskCategories = useCallback(
        async (id: number, nextCategories: number[]) => {
            await makeUpdateTaskCategories(
            categories,
            setTasks,
            setSelectedTask,
            fetchTasks,
            )(id, nextCategories);
        },
        [categories, setTasks, setSelectedTask, fetchTasks],
    );
    return {
        toggleComplete,
        submitTask,
        deleteTask,
        updateTaskCategories,
    };
}