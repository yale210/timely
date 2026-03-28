import type { TaskFormErrors } from "@/types";

/**
 * Checks if the start and end times are valid.
 * @param startDateTime start date
 * @param endDateTime end date
 */
export function isTaskTimeInvalid(startDateTime: Date, endDateTime: Date) {
    const isStartInvalid = Number.isNaN(startDateTime.getTime());
    const isEndInvalid = Number.isNaN(endDateTime.getTime());
    return isStartInvalid || isEndInvalid || startDateTime >= endDateTime;
}

/**
 * Checks if the importance is valid.
 * @param importance importance value constrained between 0 and 10.
 */
export function isTaskImportanceInvalid(importance: number) {
    return importance < 1 || importance > 10 || Number.isNaN(importance);
}

/**
 * Checks whether completed minutes are valid.
 * @param estimatedMinutes estimated minutes value
 * @param completedMinutes completed minutes value
 */
export function isTaskCompletedMinutesInvalid(
    estimatedMinutes: number | "",
    completedMinutes: number | "",
) {
    const normalizedEstimatedMinutes = Number(estimatedMinutes || 0);
    const parsedCompletedMinutes = Number(completedMinutes || 0);

    return completedMinutes === ""
        || Number.isNaN(parsedCompletedMinutes)
        || parsedCompletedMinutes < 0
        || parsedCompletedMinutes > normalizedEstimatedMinutes;
}

/**
 * Checks whether minimum split minutes are valid.
 * @param allowSplit whether splitting is enabled
 * @param minSplitMinutes minimum split minutes string
 */
export function isTaskMinSplitMinutesInvalid(
    allowSplit: boolean,
    minSplitMinutes: string,
) {
    const parsedMinSplitMinutes = Number.parseInt(minSplitMinutes, 10);

    return allowSplit && (
        minSplitMinutes.trim() === ""
        || Number.isNaN(parsedMinSplitMinutes)
        || parsedMinSplitMinutes < 15
        || parsedMinSplitMinutes > 240
    );
}

/**
 * Checks whether maximum split minutes are valid.
 * @param allowSplit whether splitting is enabled
 * @param minSplitMinutes minimum split minutes string
 * @param maxSplitMinutes maximum split minutes string
 */
export function isTaskMaxSplitMinutesInvalid(
    allowSplit: boolean,
    minSplitMinutes: string,
    maxSplitMinutes: string,
) {
    const parsedMinSplitMinutes = Number.parseInt(minSplitMinutes, 10);
    const parsedMaxSplitMinutes = Number.parseInt(maxSplitMinutes, 10);

    return allowSplit && maxSplitMinutes.trim() !== "" && (
        Number.isNaN(parsedMaxSplitMinutes)
        || parsedMaxSplitMinutes < 15
        || parsedMaxSplitMinutes > 1440
        || parsedMaxSplitMinutes < parsedMinSplitMinutes
    );
}

/**
 * Checks whether a buffer minutes value is valid.
 * @param bufferEnabled whether buffers are enabled
 * @param value buffer minutes string
 */
export function isTaskBufferMinutesInvalid(
    bufferEnabled: boolean,
    value: string,
) {
    const parsedValue = Number.parseInt(value, 10);

    return bufferEnabled && (
        value.trim() === ""
        || Number.isNaN(parsedValue)
        || parsedValue < 0
        || parsedValue > 240
    );
}

/**
 * Builds errors from existing task.
 * @param startDateTime Task start date.
 * @param endDateTime Task end date.
 * @param importance Task importance.
 * @param shouldValidateTime Whether or not the start and end time validity should be checked.
 * @param estimatedMinutes estimated minutes value
 * @param completedMinutes completed minutes value
 * @param allowSplit whether splitting is enabled
 * @param minSplitMinutes minimum split minutes string
 * @param maxSplitMinutes maximum split minutes string
 * @param bufferEnabled whether buffers are enabled
 * @param bufferBeforeMinutes buffer before string
 * @param bufferAfterMinutes buffer after string
 * @param hasSubmitted whether submit has been attempted
 */
export function buildTaskFormErrors(
    startDateTime: Date,
    endDateTime: Date,
    importance: number,
    shouldValidateTime: boolean,
    estimatedMinutes: number | "",
    completedMinutes: number | "",
    allowSplit: boolean,
    minSplitMinutes: string,
    maxSplitMinutes: string,
    bufferEnabled: boolean,
    bufferBeforeMinutes: string,
    bufferAfterMinutes: string,
    hasSubmitted: boolean,
) {
    const errors: TaskFormErrors = {};

    if (shouldValidateTime && isTaskTimeInvalid(startDateTime, endDateTime)) {
        errors.start = true;
        errors.deadline = true;
    }

    if (isTaskImportanceInvalid(importance)) {
        errors.importance = true;
    }

    if (hasSubmitted && isTaskCompletedMinutesInvalid(estimatedMinutes, completedMinutes)) {
        errors.completed_minutes = true;
    }

    if (hasSubmitted && isTaskMinSplitMinutesInvalid(allowSplit, minSplitMinutes)) {
        errors.min_split_minutes = true;
    }

    if (hasSubmitted && isTaskMaxSplitMinutesInvalid(
        allowSplit,
        minSplitMinutes,
        maxSplitMinutes,
    )) {
        errors.max_split_minutes = true;
    }

    if (hasSubmitted && isTaskBufferMinutesInvalid(bufferEnabled, bufferBeforeMinutes)) {
        errors.buffer_before_minutes = true;
    }

    if (hasSubmitted && isTaskBufferMinutesInvalid(bufferEnabled, bufferAfterMinutes)) {
        errors.buffer_after_minutes = true;
    }

    return errors;
}

/**
 * Checks if there are errors preventing the Task being submitted.
 * @param startDateTime start time
 * @param endDateTime end date
 * @param importance importance (0-10)
 * @param estimatedMinutes estimated minutes value
 * @param completedMinutes completed minutes value
 * @param allowSplit whether splitting is enabled
 * @param minSplitMinutes minimum split minutes string
 * @param maxSplitMinutes maximum split minutes string
 * @param bufferEnabled whether buffers are enabled
 * @param bufferBeforeMinutes buffer before string
 * @param bufferAfterMinutes buffer after string
 */
export function hasTaskBlockingErrors(
    startDateTime: Date,
    endDateTime: Date,
    importance: number,
    estimatedMinutes: number | "",
    completedMinutes: number | "",
    allowSplit: boolean,
    minSplitMinutes: string,
    maxSplitMinutes: string,
    bufferEnabled: boolean,
    bufferBeforeMinutes: string,
    bufferAfterMinutes: string,
) {
    return isTaskTimeInvalid(startDateTime, endDateTime)
        || isTaskImportanceInvalid(importance)
        || isTaskCompletedMinutesInvalid(estimatedMinutes, completedMinutes)
        || isTaskMinSplitMinutesInvalid(allowSplit, minSplitMinutes)
        || isTaskMaxSplitMinutesInvalid(allowSplit, minSplitMinutes, maxSplitMinutes)
        || isTaskBufferMinutesInvalid(bufferEnabled, bufferBeforeMinutes)
        || isTaskBufferMinutesInvalid(bufferEnabled, bufferAfterMinutes);
}