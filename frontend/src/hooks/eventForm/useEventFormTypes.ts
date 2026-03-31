import type { Event, EventSubmission, Category } from "@/types";
/**
 *
 */
export type TimeUnit = "minutes" | "hours" | "days" | "weeks" | "months" | "years";

/**
 *
 */
export interface ReminderFormState {
    send_push: boolean;
    value: number;
    unit: TimeUnit;
}

/**
 *
 */
export interface NormalisedEventReminder {
    send_push: boolean;
    minutes_before: number;
}

/**
 *
 */
export interface NormalisedEventSubmission {
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time: string;
    colour: string;
    categories: number[];
    recurrence_interval: Event["recurrence_interval"];
    recurrence_end: string | null;
    reminders: NormalisedEventReminder[];
}

/**
 *
 */
export interface EventFormProps {
    initialData?: Event;
    categories: Category[];
    onCreateCategory: (text: string) => Promise<Category>;
    onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
    onDeleteCategory: (id: number) => Promise<void>;
    onSubmit: (data: EventSubmission) => Promise<void> | void;
    onCancel: () => void;
    onDataChange?: (data: Partial<Event>) => void;
}
