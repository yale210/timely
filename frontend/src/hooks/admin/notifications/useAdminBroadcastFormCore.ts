import { useEffect, useMemo, useState } from "react";
import { type AdminNotificationTarget } from "@/types";

/** Maximum character count for broadcast titles. */
export const TITLE_LIMIT = 60;

/** Maximum character count for broadcast messages. */
export const MESSAGE_LIMIT = 240;

/** Available target audience options for admin broadcasts. */
export const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
  { label: "Specific users", value: "users" },
];

/**
 * Hook to manage basic form state for the broadcast form.
 * @returns Form state and setters.
 */
export const useBroadcastFormState = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AdminNotificationTarget>("all");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  return {
    title,
    setTitle,
    message,
    setMessage,
    target,
    setTarget,
    userIdsInput,
    setUserIdsInput,
    confirmationChecked,
    setConfirmationChecked,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    previewTitle,
    setPreviewTitle,
    previewMessage,
    setPreviewMessage,
  };
};

/**
 * Hook to manage side effects for the broadcast form.
 * @param title - Current title.
 * @param message - Current message.
 * @param setPreviewTitle - Setter for preview title.
 * @param setPreviewMessage - Setter for preview message.
 */
export const useBroadcastFormEffects = (
  title: string,
  message: string,
  setPreviewTitle: (v: string) => void,
  setPreviewMessage: (v: string) => void,
) => {
  useEffect(() => {
    const t = setTimeout(() => {
      setPreviewTitle(title.trim());
      setPreviewMessage(message.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [message, title, setPreviewTitle, setPreviewMessage]);
};

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
  confirmationChecked: boolean,
) => {
  const validation = useMemo(
    () => getBroadcastValidation(title, message, target, audienceCount),
    [title, message, target, audienceCount],
  );
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
