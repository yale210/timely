import type { Task } from "@/types";
import { useState } from "react";
import {
    toDateInputValue,
    toTimeInputValue,
} from "@/hooks/taskForm/taskFormDates";

/**
 * The State returns are split into 4 functions called by the exported function.
 * To maintain the 25 line limit. :)
 */

function useFirstStates(initialData: Task | undefined) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [date, setDate] = useState(
        initialData?.start_time
            ?   toDateInputValue(initialData.start_time)
            :   toDateInputValue(new Date().toISOString())
    );
    const [startTime, setStartTime] = useState(
        initialData?.start_time
            ?   toTimeInputValue(initialData.start_time, "10:00")
            :   "10:00"
    );
    const [deadline, setDeadline] = useState(
    initialData?.deadline
        ?   toDateInputValue(initialData.deadline)
        :   ""
    );
    return {
        title, setTitle,
        description, setDescription,
        date, setDate,
        startTime, setStartTime,
        deadline, setDeadline,
    }
}
function useSecondStates(initialData: Task | undefined) {
    const [deadlineTime, setDeadlineTime] = useState(
        initialData?.deadline
        ?   toTimeInputValue(initialData.deadline)
            :   ""
    );
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasTouchedTime, setHasTouchedTime] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<number[]>(
        initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
    );
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">(
        initialData?.estimated_minutes ?? ""
    );
    const [completedMinutes, setCompletedMinutes] = useState<number | "">(
        initialData?.completed_minutes ?? 0,
    );
    return {
        deadlineTime, setDeadlineTime,
        hasSubmitted, setHasSubmitted,
        hasTouchedTime, setHasTouchedTime,
        selectedCategories, setSelectedCategories,
        estimatedMinutes, setEstimatedMinutes,
        completedMinutes, setCompletedMinutes,
    }
}

function useTaskScheduleModeStates(initialData: Task | undefined) {
    const [importance, setImportance] = useState(initialData?.importance ?? 5);
    const [allowSplit, setAllowSplit] = useState(initialData?.allow_split ?? false);
    const [autoSchedule, setAutoSchedule] = useState(
        initialData?.locked ? false : true,
    );

    return {
        importance, setImportance,
        allowSplit, setAllowSplit,
        autoSchedule, setAutoSchedule,
    }
}

function useTaskSplitWindowStates(
    initialData: Task | undefined,
    defaultMinSplitMinutes: number,
) {
    const [bufferEnabled, setBufferEnabled] = useState(
        (initialData?.buffer_before_minutes ?? 0) > 0 || (initialData?.buffer_after_minutes ?? 0) > 0,
    );
    const [minSplitMinutes, setMinSplitMinutes] = useState<string>(
        String(initialData?.min_split_minutes ?? defaultMinSplitMinutes),
    );
    const [maxSplitMinutes, setMaxSplitMinutes] = useState<string>(
        initialData?.max_split_minutes == null ? "" : String(initialData.max_split_minutes),
    );
    const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState<string>(
        String(initialData?.buffer_before_minutes ?? 0),
    );
    const [bufferAfterMinutes, setBufferAfterMinutes] = useState<string>(
        String(initialData?.buffer_after_minutes ?? 0),
    );

    return {
        bufferEnabled, setBufferEnabled,
        minSplitMinutes, setMinSplitMinutes,
        maxSplitMinutes, setMaxSplitMinutes,
        bufferBeforeMinutes, setBufferBeforeMinutes,
        bufferAfterMinutes, setBufferAfterMinutes,
    }
}

function useTaskSchedulingStates(
    initialData: Task | undefined,
    defaultMinSplitMinutes: number,
) {
    return {
        ...useTaskScheduleModeStates(initialData),
        ...useTaskSplitWindowStates(initialData, defaultMinSplitMinutes),
    }
}

function useTaskSubmissionStates(initialData: Task | undefined) {
    const [isTaskLocked, setIsTaskLocked] = useState(initialData?.locked ?? false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});

    return {
        isTaskLocked, setIsTaskLocked,
        isSubmitting, setIsSubmitting,
        submitError, setSubmitError,
        serverFieldErrors, setServerFieldErrors,
    }
}

interface PickerPosition {
    top: number;
    left: number;
}

function useColourStates(defaultColour: string, initialData?: Task) {
    const [colour, setColour] = useState(initialData?.colour ?? defaultColour);
    const [showPickerMenu, setShowPickerMenu] = useState(false);
    const [pickerPosition, setPickerPosition] = useState<PickerPosition | null>(null);
    const [colourInput, setColourInput] = useState(colour);
    const [colourError, setColourError] = useState<string | null>(null);
    return {
        colour, setColour,
        showPickerMenu, setShowPickerMenu,
        pickerPosition, setPickerPosition,
        colourInput, setColourInput,
        colourError, setColourError,
    }
}

/**
 * Builds and returns all state used by the task form.
 * @param defaultColour Default colour used when the task has no custom colour.
 * @param initialData Existing task data when editing.
 * @param DEFAULT_MIN_SPLIT_MINUTES Default minimum split duration in minutes.
 * @returns Combined task form state and setters.
 */
export default function useTaskFormState(defaultColour: string, initialData: Task | undefined, DEFAULT_MIN_SPLIT_MINUTES? : number) {
    DEFAULT_MIN_SPLIT_MINUTES = DEFAULT_MIN_SPLIT_MINUTES ?? 30;
    return {
        ...useFirstStates(initialData),
        ...useSecondStates(initialData),
        ...useTaskSchedulingStates(initialData, DEFAULT_MIN_SPLIT_MINUTES),
        ...useTaskSubmissionStates(initialData),
        ...useColourStates(defaultColour, initialData),
    }
}
