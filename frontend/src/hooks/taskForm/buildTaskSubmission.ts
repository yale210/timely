import type { Task, TaskSubmission } from "@/types";
import { toIsoOrEmpty } from "@/hooks/taskForm/taskFormDates";

interface BuildTaskSubmissionArgs {
    title: string;
    description: string;
    startDateTime: Date;
    endDateTime: Date;
    selectedCategories: number[];
    importance: number;
    estimatedMinutes: number | "";
    colour: string;
    autoSchedule: boolean;
    allowSplit: boolean;
    initialData?: Task;
    completed_minutes: number;
    min_split_minutes: number;
    max_split_minutes: number | null;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
}

/**
 * Converts given arguments to a valid TaskSubmission.
 * @param args an object to be converted to TaskSubmission
 */
export function buildTaskSubmission(args: BuildTaskSubmissionArgs): TaskSubmission {
    const {
        title,
        description,
        startDateTime,
        endDateTime,
        selectedCategories,
        importance,
        estimatedMinutes,
        colour,
        autoSchedule,
        allowSplit,
        completed_minutes,
        min_split_minutes,
        max_split_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
    } = args;

    const estimated_minutes = Number(estimatedMinutes || 0);
    const completed = estimated_minutes > 0 && completed_minutes >= estimated_minutes;

    return {
        title,
        description,
        start_time: toIsoOrEmpty(startDateTime),
        deadline: toIsoOrEmpty(endDateTime),
        categories: selectedCategories,
        importance,
        estimated_minutes,
        colour,
        locked: !autoSchedule,
        allow_split: allowSplit,
        completed,
        completed_minutes,
        min_split_minutes,
        max_split_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
    };
}