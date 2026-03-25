import { useMemo } from "react";
import { type AdminNotificationTarget } from "@/types";
import { TITLE_LIMIT, MESSAGE_LIMIT } from "./constants";

const getBroadcastValidation = (
  title: string,
  message: string,
  target: AdminNotificationTarget,
  audienceCount: number,
) => {
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();

  return {
    trimmedTitle,
    trimmedMessage,
    hasTitle: trimmedTitle.length > 0,
    hasMessage: trimmedMessage.length > 0,
    validTitleLength: trimmedTitle.length <= TITLE_LIMIT,
    validMessageLength: trimmedMessage.length <= MESSAGE_LIMIT,
    hasUsersTarget: target !== "users" || audienceCount > 0,
  };
};

/**
 * Hook to manage validation for the broadcast form.
 * @param title - Current title.
 * @param message - Current message.
 * @param target - Current target.
 * @param audienceCount - Estimated audience count.
 * @param confirmationChecked - Whether confirmation is checked.
 * @returns Validation state and canSubmit flag.
 */
export const useBroadcastValidation = (
  title: string,
  message: string,
  target: AdminNotificationTarget,
  audienceCount: number,
  confirmationChecked: boolean
) => {
  const validation = useMemo(() => getBroadcastValidation(title, message, target, audienceCount), [title, message, target, audienceCount]);
  const canSubmit = validation.hasTitle && validation.hasMessage && validation.validTitleLength && validation.validMessageLength && validation.hasUsersTarget && audienceCount > 0 && confirmationChecked;

  return { validation, canSubmit };
};
