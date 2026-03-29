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

function useToggleCompleteMutation(
    tasks: Task[],
    fetchTasks: () => Promise<void>,
) {
    return useCallback(async (id: number) => {
        await makeToggleComplete(tasks, fetchTasks)(id);
    }, [tasks, fetchTasks]);
}

function useSubmitTaskMutation(
    selectedTask: Task | undefined,
    fetchTasks: () => Promise<void>,
) {
    return useCallback(async (data: TaskSubmission) => {
        return makeSubmitTask(selectedTask, fetchTasks)(data);
    }, [selectedTask, fetchTasks]);
}

function useDeleteTaskMutation(fetchTasks: () => Promise<void>) {
    return useCallback(async (id: number) => {
        await makeDeleteTask(fetchTasks)(id);
    }, [fetchTasks]);
}

function useUpdateTaskCategoriesMutation(
    categories: Category[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>,
    fetchTasks: () => Promise<void>,
) {
    return useCallback(async (id: number, nextCategories: number[]) => {
        await makeUpdateTaskCategories(
            categories,
            setTasks,
            setSelectedTask,
            fetchTasks,
        )(id, nextCategories);
    }, [categories, setTasks, setSelectedTask, fetchTasks]);
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
    const toggleComplete = useToggleCompleteMutation(args.tasks, args.fetchTasks);
    const submitTask = useSubmitTaskMutation(args.selectedTask, args.fetchTasks);
    const deleteTask = useDeleteTaskMutation(args.fetchTasks);
    const updateTaskCategories = useUpdateTaskCategoriesMutation(
        args.categories,
        args.setTasks,
        args.setSelectedTask,
        args.fetchTasks,
    );

    return {
        toggleComplete,
        submitTask,
        deleteTask,
        updateTaskCategories,
    };
}
