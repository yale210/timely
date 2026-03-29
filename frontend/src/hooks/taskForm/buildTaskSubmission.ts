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

function buildTaskCompletionState(
    estimatedMinutes: number | "",
    completedMinutes: number,
) {
    const estimated_minutes = Number(estimatedMinutes || 0);
    return {
        estimated_minutes,
        completed: estimated_minutes > 0 && completedMinutes >= estimated_minutes,
    };
}

function buildTaskSubmissionPayload(
    args: BuildTaskSubmissionArgs,
    completionState: ReturnType<typeof buildTaskCompletionState>,
): TaskSubmission {
    return {
        title: args.title,
        description: args.description,
        start_time: toIsoOrEmpty(args.startDateTime),
        deadline: toIsoOrEmpty(args.endDateTime),
        categories: args.selectedCategories,
        importance: args.importance,
        estimated_minutes: completionState.estimated_minutes,
        colour: args.colour,
        locked: !args.autoSchedule,
        allow_split: args.allowSplit,
        completed: completionState.completed,
        completed_minutes: args.completed_minutes,
        min_split_minutes: args.min_split_minutes,
        max_split_minutes: args.max_split_minutes,
        buffer_before_minutes: args.buffer_before_minutes,
        buffer_after_minutes: args.buffer_after_minutes,
    };
}

/**
 * Converts given arguments to a valid TaskSubmission.
 * @param args an object to be converted to TaskSubmission
 */
export function buildTaskSubmission(args: BuildTaskSubmissionArgs): TaskSubmission {
    return buildTaskSubmissionPayload(
        args,
        buildTaskCompletionState(args.estimatedMinutes, args.completed_minutes),
    );
}
