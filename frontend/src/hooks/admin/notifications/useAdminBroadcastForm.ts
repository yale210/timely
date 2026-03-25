import { type FormEvent, useCallback, useEffect } from "react";
import { useBroadcastUsers } from "./useAdminBroadcastForm/useBroadcastUsers";
import { useBroadcastAudience } from "./useAdminBroadcastForm/useBroadcastAudience";
import { useBroadcastDelivery } from "./useAdminBroadcastForm/useBroadcastDelivery";
import { useBroadcastValidation } from "./useAdminBroadcastForm/useBroadcastValidation";
import { useBroadcastSubmission } from "./useAdminBroadcastForm/useBroadcastSubmission";
import { useBroadcastFormState } from "./useAdminBroadcastForm/useBroadcastFormState";
import { useBroadcastFormEffects } from "./useAdminBroadcastForm/useBroadcastFormEffects";
import { TITLE_LIMIT, MESSAGE_LIMIT, targetOptions } from "./useAdminBroadcastForm/constants";

const useResetBroadcastUsers = (
  target: string,
  setSelectedUserIds: (ids: number[]) => void,
  setUserIdsInput: (value: string) => void,
) => {
  useEffect(() => {
    if (target !== "users") {
      setSelectedUserIds([]);
      setUserIdsInput("");
    }
  }, [target, setSelectedUserIds, setUserIdsInput]);
};

const buildBroadcastFormReturn = (
  s: ReturnType<typeof useBroadcastFormState>,
  u: ReturnType<typeof useBroadcastUsers>,
  a: ReturnType<typeof useBroadcastAudience>,
  d: ReturnType<typeof useBroadcastDelivery>,
  v: ReturnType<typeof useBroadcastValidation>["validation"],
  canSubmit: boolean,
  sub: ReturnType<typeof useBroadcastSubmission>,
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void,
) => ({
  state: {
    formData: { title: s.title, message: s.message, target: s.target, userIdsInput: s.userIdsInput, confirmationChecked: s.confirmationChecked },
    users: u, audience: a, preview: { previewTitle: s.previewTitle, previewMessage: s.previewMessage },
    delivery: d, validation: v, canSubmit, isConfirmModalOpen: s.isConfirmModalOpen,
  },
  loading: { isSubmitting: sub.isSubmitting, isUsersLoading: u.isUsersLoading },
  error: { form: sub.error, users: u.usersError },
  constants: { usersPageSize: 50, titleLimit: TITLE_LIMIT, messageLimit: MESSAGE_LIMIT, targetOptions },
  actions: {
    setTitle: s.setTitle, setMessage: s.setMessage, setTarget: s.setTarget, setSearch: u.setSearch, setRoleFilter: u.setRoleFilter,
    setUsersPage: u.setUsersPage, setUserIdsInput: s.setUserIdsInput, setConfirmationChecked: s.setConfirmationChecked, setConfirmModalOpen: s.setIsConfirmModalOpen,
    toggleSelectAll: u.toggleSelectAll, toggleUserSelection: u.toggleUserSelection, handleSubmit,
    handleConfirmSend: () => sub.handleConfirmSend(v, s.target, a.selectedIdsForPayload),
  },
});

/**
 * Manages state and actions for composing and sending admin broadcasts.
 * @returns Structured state, loading flags, errors, constants, and actions.
 */
export const useAdminBroadcastForm = () => {
  const s = useBroadcastFormState();
  const u = useBroadcastUsers(s.target);
  const a = useBroadcastAudience(s.target, u.selectedUserIds, s.userIdsInput);
  const d = useBroadcastDelivery();
  const { validation: v, canSubmit } = useBroadcastValidation(s.title, s.message, s.target, a.targetAudienceCount, s.confirmationChecked);
  const sub = useBroadcastSubmission(d);

  useBroadcastFormEffects(s.title, s.message, s.setPreviewTitle, s.setPreviewMessage);
  useResetBroadcastUsers(s.target, u.setSelectedUserIds, s.setUserIdsInput);

  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sub.setError(null);
    if (!canSubmit) { sub.setError("Please complete all required fields and confirmation."); return; }
    s.setIsConfirmModalOpen(true);
  }, [canSubmit, sub, s]);

  return buildBroadcastFormReturn(s, u, a, d, v, canSubmit, sub, handleSubmit);
};
