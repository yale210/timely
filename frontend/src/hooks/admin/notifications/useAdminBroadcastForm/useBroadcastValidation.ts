import { useMemo } from "react";
import { type AdminNotificationTarget } from "@/types";
import { TITLE_LIMIT, MESSAGE_LIMIT } from "./constants";

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
  const validation = useMemo(() => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const hasTitle = trimmedTitle.length > 0;
    const hasMessage = trimmedMessage.length > 0;
    const validTitleLength = trimmedTitle.length <= TITLE_LIMIT;
    const validMessageLength = trimmedMessage.length <= MESSAGE_LIMIT;
    const hasUsersTarget = target !== "users" || audienceCount > 0;

    return {
      trimmedTitle,
      trimmedMessage,
      hasTitle,
      hasMessage,
      validTitleLength,
      validMessageLength,
      hasUsersTarget,
    };
  }, [title, message, target, audienceCount]);

  const canSubmit =
    validation.hasTitle &&
    validation.hasMessage &&
    validation.validTitleLength &&
    validation.validMessageLength &&
    validation.hasUsersTarget &&
    audienceCount > 0 &&
    confirmationChecked;

  return { validation, canSubmit };
};
