import { useState } from "react";
import { type AdminNotificationTarget } from "@/types";

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
    title, setTitle,
    message, setMessage,
    target, setTarget,
    userIdsInput, setUserIdsInput,
    confirmationChecked, setConfirmationChecked,
    isConfirmModalOpen, setIsConfirmModalOpen,
    previewTitle, setPreviewTitle,
    previewMessage, setPreviewMessage,
  };
};
