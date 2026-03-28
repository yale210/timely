import type { TaskSubmission } from "@/types";

/**
 * Normalised task submission data used for equality checks.
 */
export interface NormalisedTaskSubmission {
    title: string;
    description: string;
    start_time: string;
    deadline: string;
    colour: string;
    categories: number[];
    importance: number;
    estimated_minutes: number;
    completed_minutes: number;
    completed: boolean;
    locked: boolean;
    allow_split: boolean;
    min_split_minutes: number;
    max_split_minutes: number | null;
    buffer_before_minutes: number;
    buffer_after_minutes: number;
}

/**
 * Returns a standardised TaskSubmission with default values if missing.
 * @param submission TaskSubmission to be normalised.
 */
export function normaliseTaskSubmission(
    submission: TaskSubmission,
): NormalisedTaskSubmission {
    return {
        title: submission.title ?? "",
        description: submission.description ?? "",
        start_time: submission.start_time ?? "",
        deadline: submission.deadline ?? "",
        colour: submission.colour ?? "",
        categories: [...(submission.categories ?? [])].sort((a, b) => a - b),
        importance: Number(submission.importance ?? 5),
        estimated_minutes: Number(submission.estimated_minutes ?? 60),
        completed_minutes: Number(submission.completed_minutes ?? 0),
        completed: Boolean(submission.completed),
        locked: Boolean(submission.locked),
        allow_split: Boolean(submission.allow_split),
        min_split_minutes: Number(submission.min_split_minutes ?? 30),
        max_split_minutes:
            submission.max_split_minutes == null
                ? null
                : Number(submission.max_split_minutes),
        buffer_before_minutes: Number(submission.buffer_before_minutes ?? 0),
        buffer_after_minutes: Number(submission.buffer_after_minutes ?? 0),
    };
}

/**
 * Compares two normalised task submissions for equality.
 * @param left The first normalised task submission.
 * @param right The second normalised task submission.
 * @returns True when both submissions are equal.
 */
export function isTaskSubmissionEqual(
    left: NormalisedTaskSubmission,
    right: NormalisedTaskSubmission,
) {
    return JSON.stringify(left) === JSON.stringify(right);
}