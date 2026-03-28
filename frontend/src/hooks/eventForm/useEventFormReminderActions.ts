import { useCallback } from "react";
import type { ReminderFormState } from "@/hooks/eventForm/useEventFormTypes";

interface Args {
    reminders: ReminderFormState[];
    canAddReminder: boolean;
    permission: NotificationPermission | "unsupported";
    isSubscribed: boolean;
    subscribe: () => Promise<void>;
    setReminders: React.Dispatch<React.SetStateAction<ReminderFormState[]>>;
    setPushDeniedNotice: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    setValidationNowMs: React.Dispatch<React.SetStateAction<number>>;
}

function refreshValidationNow(setValidationNowMs: Args["setValidationNowMs"]) {
    setValidationNowMs(Date.now());
}

/**
 * Creates Reminder hooks for use in EventForm
 * @param args data imported from EventForm. of type Args as defined above in this file.
 */
export function useEventReminderActions(args: Args) {
    const {
        canAddReminder,
        permission,
        isSubscribed,
        subscribe,
        setReminders,
        setPushDeniedNotice,
        setValidationNowMs,
    } = args;

    const addReminder = useCallback(() => {
        if (!canAddReminder) return;
        refreshValidationNow(setValidationNowMs);
        setReminders((prev) => [
        ...prev,
        { send_email: false, send_push: false, value: 15, unit: "minutes" },
        ]);
    }, [canAddReminder, setReminders, setValidationNowMs]);

    const removeReminder = useCallback((index: number) => {
        refreshValidationNow(setValidationNowMs);
        setReminders((prev) => prev.filter((_, i) => i !== index));
    }, [setReminders, setValidationNowMs]);

    const updateReminder = useCallback(
        <K extends keyof ReminderFormState>(
        index: number,
        field: K,
        value: ReminderFormState[K],
        ) => {
        refreshValidationNow(setValidationNowMs);
        setReminders((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
        },
        [setReminders, setValidationNowMs],
    );

    const toggleReminderChannel = useCallback((
        index: number,
        field: "send_email" | "send_push",
        value: boolean,
    ) => {
        refreshValidationNow(setValidationNowMs);
        setReminders((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
        });
    }, [setReminders, setValidationNowMs]);

    const handleTogglePush = useCallback(async (index: number, nextValue: boolean) => {
        setPushDeniedNotice((prev) => ({ ...prev, [index]: false }));

        if (!nextValue) {
        toggleReminderChannel(index, "send_push", false);
        return;
        }
        if (permission === "denied") {
        setPushDeniedNotice((prev) => ({ ...prev, [index]: true }));
        toggleReminderChannel(index, "send_push", false);
        return;
        }
        if (!isSubscribed) {
        await subscribe();
        if (Notification.permission !== "granted") {
            setPushDeniedNotice((prev) => ({ ...prev, [index]: true }));
            toggleReminderChannel(index, "send_push", false);
            return;
        }
        }

        toggleReminderChannel(index, "send_push", true);
    }, [permission, isSubscribed, subscribe, setPushDeniedNotice, toggleReminderChannel]);

    return {
        addReminder,
        removeReminder,
        updateReminder,
        toggleReminderChannel,
        handleTogglePush,
    };
}