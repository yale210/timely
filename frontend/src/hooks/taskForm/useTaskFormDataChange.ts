import { useEffect } from "react";
import type { Task } from "@/types";
import {
    combineTimezoneDateAndTimeToIso,
    getStoredUserTimezone,
} from "@/utils/userTimezone";

interface UseTaskFormDataChangeArgs {
    onDataChange?: (data: Partial<Task>) => void;
    title: string;
    description: string;
    date: string;
    startTime: string;
}

/**
 * Notifies the parent when core task form fields change.
 * @param root0 Hook arguments.
 * @param root0.onDataChange Optional callback for task preview updates.
 * @param root0.title The current task title.
 * @param root0.description The current task description.
 * @param root0.date The current task date input.
 * @param root0.startTime The current task start time input.
 */
export default function useTaskFormDataChange({
    onDataChange,
    title,
    description,
    date,
    startTime,
}: UseTaskFormDataChangeArgs) {
    useEffect(() => {
        if (!onDataChange) return;
        onDataChange({
            title,
            description,
            start_time: combineTimezoneDateAndTimeToIso(
                date,
                startTime,
                getStoredUserTimezone(),
            ),
        });
    }, [title, description, date, startTime, onDataChange]);
}