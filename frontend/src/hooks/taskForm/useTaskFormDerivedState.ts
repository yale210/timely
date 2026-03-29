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

interface ParsedTaskFormValues {
    normalizedEstimatedMinutes: number;
    parsedCompletedMinutes: number;
    parsedMinSplitMinutes: number;
    parsedMaxSplitMinutes: number | null;
    parsedBufferBeforeMinutes: number;
    parsedBufferAfterMinutes: number;
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

function buildParsedTaskFormValues(args: Args): ParsedTaskFormValues {
    return {
        normalizedEstimatedMinutes: toNumberOrZero(args.estimatedMinutes),
        parsedCompletedMinutes: toNumberOrZero(args.completedMinutes),
        parsedMinSplitMinutes: Number.parseInt(args.minSplitMinutes, 10),
        parsedMaxSplitMinutes: toNullableNumber(args.maxSplitMinutes),
        parsedBufferBeforeMinutes: toNumberOrZero(args.bufferBeforeMinutes),
        parsedBufferAfterMinutes: toNumberOrZero(args.bufferAfterMinutes),
    };
}

function buildTaskValidationState(
    args: Args,
    startDateTime: Date,
    endDateTime: Date,
) {
    return {
        errors: buildTaskErrors(args, startDateTime, endDateTime),
        hasBlockingErrors: buildTaskBlockingState(args, startDateTime, endDateTime),
    };
}

function buildTaskErrors(
    args: Args,
    startDateTime: Date,
    endDateTime: Date,
) {
    const shouldValidateTime = args.hasSubmitted || args.hasTouchedTime;
    return buildTaskFormErrors(
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
    );
}

function buildTaskBlockingState(
    args: Args,
    startDateTime: Date,
    endDateTime: Date,
) {
    return hasTaskBlockingErrors(
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
    );
}

function buildDerivedTaskSubmission(
    args: Args,
    startDateTime: Date,
    endDateTime: Date,
    parsedValues: ParsedTaskFormValues,
) {
    return buildTaskSubmission({
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
        completed_minutes: parsedValues.parsedCompletedMinutes,
        min_split_minutes: parsedValues.parsedMinSplitMinutes,
        max_split_minutes: parsedValues.parsedMaxSplitMinutes,
        buffer_before_minutes: args.bufferEnabled ? parsedValues.parsedBufferBeforeMinutes : 0,
        buffer_after_minutes: args.bufferEnabled ? parsedValues.parsedBufferAfterMinutes : 0,
    });
}

function buildTaskDerivedStateResult(
    args: Args,
    startDateTime: Date,
    endDateTime: Date,
    parsedValues: ParsedTaskFormValues,
) {
    const validationState = buildTaskValidationState(args, startDateTime, endDateTime);
    return {
        startDateTime,
        endDateTime,
        ...validationState,
        submission: buildDerivedTaskSubmission(args, startDateTime, endDateTime, parsedValues),
        progressPercent: buildTaskProgressPercent(
            parsedValues.normalizedEstimatedMinutes,
            parsedValues.parsedCompletedMinutes,
        ),
        normalizedEstimatedMinutes: parsedValues.normalizedEstimatedMinutes,
        parsedCompletedMinutes: parsedValues.parsedCompletedMinutes,
        ...getTaskFormColourState(args.categories, args.selectedCategories, args.colour),
    };
}

/**
 * Computes derived task form state.
 * @param args Task form inputs.
 */
export function useTaskFormDerivedState(args: Args) {
    const startDateTime = buildTaskStartDateTime(args.date, args.startTime);
    const endDateTime = buildTaskDeadlineDateTime(args.deadline, args.deadlineTime);
    return buildTaskDerivedStateResult(
        args,
        startDateTime,
        endDateTime,
        buildParsedTaskFormValues(args),
    );
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
