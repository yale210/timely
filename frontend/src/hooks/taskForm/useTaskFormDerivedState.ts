import { useMemo, useState } from "react";
import type { Category, Task } from "@/types";
import { buildTaskSubmission } from "@/hooks/taskForm/buildTaskSubmission";
import {
    buildTaskDeadlineDateTime,
    buildTaskStartDateTime,
} from "@/hooks/taskForm/taskFormDates";
import {
    buildTaskFormErrors,
    hasTaskBlockingErrors,
} from "@/hooks/taskForm/taskFormValidation";
import { getTaskFormColourState } from "@/hooks/taskForm/taskFormColour";
import {
    isTaskSubmissionEqual,
    normaliseTaskSubmission,
} from "@/hooks/taskForm/normaliseTaskSubmission";

interface Args {
    categories: Category[];
    selectedCategories: number[];
    colour: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    deadline: string;
    deadlineTime: string;
    importance: number;
    estimatedMinutes: number | "";
    autoSchedule: boolean;
    allowSplit: boolean;
    initialData?: Task;
    hasSubmitted: boolean;
    hasTouchedTime: boolean;
    completedMinutes: number | "";
    minSplitMinutes: string;
    maxSplitMinutes: string;
    bufferEnabled: boolean;
    bufferBeforeMinutes: string;
    bufferAfterMinutes: string;
}

function toNumberOrZero(value: number | string) {
    return Number(value || 0);
}

function toNullableNumber(value: string) {
    return value.trim() === "" ? null : Number.parseInt(value, 10);
}

/**
 * Computes progress percentage from completed and estimated minutes.
 * @param normalizedEstimatedMinutes parsed estimated minutes
 * @param parsedCompletedMinutes parsed completed minutes
 */
function buildTaskProgressPercent(
    normalizedEstimatedMinutes: number,
    parsedCompletedMinutes: number,
) {
    if (normalizedEstimatedMinutes <= 0) return 0;

    return Math.min(
        100,
        Math.max(0, (parsedCompletedMinutes / normalizedEstimatedMinutes) * 100),
    );
}

/**
 * Computes derived task form state.
 * @param args Task form inputs.
 */
export function useTaskFormDerivedState(args: Args) {
    const startDateTime = useMemo(
        () => buildTaskStartDateTime(args.date, args.startTime),
        [args.date, args.startTime],
    );

    const endDateTime = useMemo(
        () => buildTaskDeadlineDateTime(args.deadline, args.deadlineTime),
        [args.deadline, args.deadlineTime],
    );

    const colourState = useMemo(
        () => getTaskFormColourState(args.categories, args.selectedCategories, args.colour),
        [args.categories, args.selectedCategories, args.colour],
    );

    const normalizedEstimatedMinutes = useMemo(
        () => toNumberOrZero(args.estimatedMinutes),
        [args.estimatedMinutes],
    );

    const parsedCompletedMinutes = useMemo(
        () => toNumberOrZero(args.completedMinutes),
        [args.completedMinutes],
    );

    const parsedMinSplitMinutes = useMemo(
        () => Number.parseInt(args.minSplitMinutes, 10),
        [args.minSplitMinutes],
    );

    const parsedMaxSplitMinutes = useMemo(
        () => toNullableNumber(args.maxSplitMinutes),
        [args.maxSplitMinutes],
    );

    const parsedBufferBeforeMinutes = useMemo(
        () => toNumberOrZero(args.bufferBeforeMinutes),
        [args.bufferBeforeMinutes],
    );

    const parsedBufferAfterMinutes = useMemo(
        () => toNumberOrZero(args.bufferAfterMinutes),
        [args.bufferAfterMinutes],
    );

    const progressPercent = useMemo(
        () => buildTaskProgressPercent(normalizedEstimatedMinutes, parsedCompletedMinutes),
        [normalizedEstimatedMinutes, parsedCompletedMinutes],
    );

    const shouldValidateTime = args.hasSubmitted || args.hasTouchedTime;

    const errors = useMemo(
        () => buildTaskFormErrors(
            startDateTime,
            endDateTime,
            args.importance,
            shouldValidateTime,
            args.estimatedMinutes,
            args.completedMinutes,
            args.allowSplit,
            args.minSplitMinutes,
            args.maxSplitMinutes,
            args.bufferEnabled,
            args.bufferBeforeMinutes,
            args.bufferAfterMinutes,
            args.hasSubmitted,
        ),
        [
            startDateTime,
            endDateTime,
            args.importance,
            shouldValidateTime,
            args.estimatedMinutes,
            args.completedMinutes,
            args.allowSplit,
            args.minSplitMinutes,
            args.maxSplitMinutes,
            args.bufferEnabled,
            args.bufferBeforeMinutes,
            args.bufferAfterMinutes,
            args.hasSubmitted,
        ],
    );

    const hasBlockingErrors = useMemo(
        () => hasTaskBlockingErrors(
            startDateTime,
            endDateTime,
            args.importance,
            args.estimatedMinutes,
            args.completedMinutes,
            args.allowSplit,
            args.minSplitMinutes,
            args.maxSplitMinutes,
            args.bufferEnabled,
            args.bufferBeforeMinutes,
            args.bufferAfterMinutes,
        ),
        [
            startDateTime,
            endDateTime,
            args.importance,
            args.estimatedMinutes,
            args.completedMinutes,
            args.allowSplit,
            args.minSplitMinutes,
            args.maxSplitMinutes,
            args.bufferEnabled,
            args.bufferBeforeMinutes,
            args.bufferAfterMinutes,
        ],
    );

    const submission = useMemo(
        () => buildTaskSubmission({
            title: args.title,
            description: args.description,
            startDateTime,
            endDateTime,
            selectedCategories: args.selectedCategories,
            importance: args.importance,
            estimatedMinutes: args.estimatedMinutes,
            colour: args.colour,
            autoSchedule: args.autoSchedule,
            allowSplit: args.allowSplit,
            initialData: args.initialData,
            completed_minutes: parsedCompletedMinutes,
            min_split_minutes: parsedMinSplitMinutes,
            max_split_minutes: parsedMaxSplitMinutes,
            buffer_before_minutes: args.bufferEnabled ? parsedBufferBeforeMinutes : 0,
            buffer_after_minutes: args.bufferEnabled ? parsedBufferAfterMinutes : 0,
        }),
        [
            args.title,
            args.description,
            startDateTime,
            endDateTime,
            args.selectedCategories,
            args.importance,
            args.estimatedMinutes,
            args.colour,
            args.autoSchedule,
            args.allowSplit,
            args.initialData,
            parsedCompletedMinutes,
            parsedMinSplitMinutes,
            parsedMaxSplitMinutes,
            args.bufferEnabled,
            parsedBufferBeforeMinutes,
            parsedBufferAfterMinutes,
        ],
    );

    return {
        startDateTime,
        endDateTime,
        errors,
        hasBlockingErrors,
        submission,
        normalizedEstimatedMinutes,
        parsedCompletedMinutes,
        progressPercent,
        ...colourState,
    };
}

/**
 * Tracks whether the current submission differs from the initial one.
 * @param submission Current submission payload.
 */
export function useTaskSubmissionChanges(
    submission: ReturnType<typeof buildTaskSubmission>,
) {
    const normalisedCurrentSubmission = useMemo(
        () => normaliseTaskSubmission(submission),
        [submission],
    );

    const [initialSubmission] = useState(
        () => normaliseTaskSubmission(submission),
    );

    const hasChanges = useMemo(
        () => !isTaskSubmissionEqual(normalisedCurrentSubmission, initialSubmission),
        [normalisedCurrentSubmission, initialSubmission],
    );

    return {
        normalisedCurrentSubmission,
        initialSubmission,
        hasChanges,
    };
}