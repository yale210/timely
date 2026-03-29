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

function buildDefaultReminder(): ReminderFormState {
  return { send_email: false, send_push: false, value: 15, unit: "minutes" };
}

function updateReminderField<K extends keyof ReminderFormState>(
  reminders: ReminderFormState[],
  index: number,
  field: K,
  value: ReminderFormState[K],
) {
  const next = [...reminders];
  next[index] = { ...next[index], [field]: value };
  return next;
}

function setPushDeniedState(
  setPushDeniedNotice: Args["setPushDeniedNotice"],
  index: number,
  nextValue: boolean,
) {
  setPushDeniedNotice((prev) => ({ ...prev, [index]: nextValue }));
}

function useAddReminderAction(
  canAddReminder: boolean,
  setReminders: Args["setReminders"],
  setValidationNowMs: Args["setValidationNowMs"],
) {
  return useCallback(() => {
    if (!canAddReminder) {
      return;
    }

    refreshValidationNow(setValidationNowMs);
    setReminders((prev) => [...prev, buildDefaultReminder()]);
  }, [canAddReminder, setReminders, setValidationNowMs]);
}

function useRemoveReminderAction(
  setReminders: Args["setReminders"],
  setValidationNowMs: Args["setValidationNowMs"],
) {
  return useCallback((index: number) => {
    refreshValidationNow(setValidationNowMs);
    setReminders((prev) => prev.filter((_, i) => i !== index));
  }, [setReminders, setValidationNowMs]);
}

function useUpdateReminderAction(
  setReminders: Args["setReminders"],
  setValidationNowMs: Args["setValidationNowMs"],
) {
  return useCallback(<K extends keyof ReminderFormState>(
    index: number,
    field: K,
    value: ReminderFormState[K],
  ) => {
    refreshValidationNow(setValidationNowMs);
    setReminders((prev) => updateReminderField(prev, index, field, value));
  }, [setReminders, setValidationNowMs]);
}

function useToggleReminderChannelAction(
  setReminders: Args["setReminders"],
  setValidationNowMs: Args["setValidationNowMs"],
) {
  return useCallback((
    index: number,
    field: "send_email" | "send_push",
    value: boolean,
  ) => {
    refreshValidationNow(setValidationNowMs);
    setReminders((prev) => updateReminderField(prev, index, field, value));
  }, [setReminders, setValidationNowMs]);
}

async function ensurePushPermission(args: Args, index: number) {
  if (args.permission === "denied") {
    setPushDeniedState(args.setPushDeniedNotice, index, true);
    return false;
  }

  if (args.isSubscribed) {
    return true;
  }

  await args.subscribe();
  if (Notification.permission === "granted") {
    return true;
  }

  setPushDeniedState(args.setPushDeniedNotice, index, true);
  return false;
}

function useHandleTogglePushAction(
  args: Args,
  toggleReminderChannel: (
    index: number,
    field: "send_email" | "send_push",
    value: boolean,
  ) => void,
) {
  return useCallback(async (index: number, nextValue: boolean) => {
    setPushDeniedState(args.setPushDeniedNotice, index, false);

    if (!nextValue) {
      toggleReminderChannel(index, "send_push", false);
      return;
    }

    if (!(await ensurePushPermission(args, index))) {
      toggleReminderChannel(index, "send_push", false);
      return;
    }

    toggleReminderChannel(index, "send_push", true);
  }, [args, toggleReminderChannel]);
}

/**
 * Creates Reminder hooks for use in EventForm
 * @param args data imported from EventForm. of type Args as defined above in this file.
 */
export function useEventReminderActions(args: Args) {
  const addReminder = useAddReminderAction(
    args.canAddReminder,
    args.setReminders,
    args.setValidationNowMs,
  );
  const removeReminder = useRemoveReminderAction(
    args.setReminders,
    args.setValidationNowMs,
  );
  const updateReminder = useUpdateReminderAction(
    args.setReminders,
    args.setValidationNowMs,
  );
  const toggleReminderChannel = useToggleReminderChannelAction(
    args.setReminders,
    args.setValidationNowMs,
  );
  const handleTogglePush = useHandleTogglePushAction(args, toggleReminderChannel);

  return {
    addReminder,
    removeReminder,
    updateReminder,
    toggleReminderChannel,
    handleTogglePush,
  };
}
