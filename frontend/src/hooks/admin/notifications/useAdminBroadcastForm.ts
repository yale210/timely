import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminUsers,
  sendAdminNotification,
  getAudienceCounts,
  getBroadcastStatus,
} from "@/api/notifications";
import {
  type AdminAudienceCounts,
  type AdminNotificationPayload,
  type AdminNotificationTarget,
  type AdminUserRole,
  type AdminUserSummary,
  type BroadcastDeliveryStatus,
  type BroadcastJobStatusResponse,
  type ApiErrorResponse,
} from "@/types/notification";

const USERS_PAGE_SIZE = 50;
const TITLE_LIMIT = 60;
const MESSAGE_LIMIT = 240;
const POLL_INTERVAL_MS = 3000;

export const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
  { label: "Specific users", value: "users" },
];

const normalizeUserIds = (rawValue: string): number[] =>
  rawValue
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

const isTerminalStatus = (status: BroadcastDeliveryStatus) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

const parseApiError = (error: unknown): string => {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return maybeError.response?.data?.error?.message ?? "Failed to send admin notification.";
};

interface AdminBroadcastValidation {
  trimmedTitle: string;
  trimmedMessage: string;
  hasTitle: boolean;
  hasMessage: boolean;
  validTitleLength: boolean;
  validMessageLength: boolean;
  hasUsersTarget: boolean;
}

interface AdminBroadcastFormState {
  formData: {
    title: string;
    message: string;
    target: AdminNotificationTarget;
    userIdsInput: string;
    confirmationChecked: boolean;
  };
  users: {
    search: string;
    roleFilter: AdminUserRole;
    users: AdminUserSummary[];
    selectedUserIds: number[];
    usersPage: number;
    usersCount: number;
    hasUsersNextPage: boolean;
    hasUsersPreviousPage: boolean;
    isAllVisibleSelected: boolean;
  };
  audience: {
    audienceCounts: AdminAudienceCounts;
    targetAudienceCount: number;
    selectedIdsForPayload: number[];
  };
  preview: {
    previewTitle: string;
    previewMessage: string;
  };
  delivery: {
    currentBroadcastId: number | null;
    deliveryStatus: BroadcastJobStatusResponse | null;
    statusLabel: string;
    statusTone: string;
  };
  validation: AdminBroadcastValidation;
  canSubmit: boolean;
  isConfirmModalOpen: boolean;
}

interface AdminBroadcastFormLoading {
  isSubmitting: boolean;
  isUsersLoading: boolean;
}

interface AdminBroadcastFormError {
  form: string | null;
  users: string | null;
}

interface AdminBroadcastFormActions {
  setTitle: (value: string) => void;
  setMessage: (value: string) => void;
  setTarget: (value: AdminNotificationTarget) => void;
  setSearch: (value: string) => void;
  setRoleFilter: (value: AdminUserRole) => void;
  setUsersPage: (page: number) => void;
  setUserIdsInput: (value: string) => void;
  setConfirmationChecked: (checked: boolean) => void;
  setConfirmModalOpen: (isOpen: boolean) => void;
  toggleSelectAll: (shouldSelect: boolean) => void;
  toggleUserSelection: (userId: number, shouldSelect: boolean) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleConfirmSend: () => Promise<void>;
}

interface UseAdminBroadcastFormReturn {
  state: AdminBroadcastFormState;
  loading: AdminBroadcastFormLoading;
  error: AdminBroadcastFormError;
  constants: {
    usersPageSize: number;
    titleLimit: number;
    messageLimit: number;
    targetOptions: { label: string; value: AdminNotificationTarget }[];
  };
  actions: AdminBroadcastFormActions;
}

/**
 * Manages state and actions for composing and sending admin broadcasts.
 * @returns Structured state, loading flags, errors, constants, and actions.
 */
export const useAdminBroadcastForm = (): UseAdminBroadcastFormReturn => { const [title, setTitle] = useState("");
const [message, setMessage] = useState("");
const [target, setTarget] = useState<AdminNotificationTarget>("all");
const [userIdsInput, setUserIdsInput] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState<AdminUserRole>("all");
const [users, setUsers] = useState<AdminUserSummary[]>([]);
const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
const [isUsersLoading, setIsUsersLoading] = useState(false);
const [usersError, setUsersError] = useState<string | null>(null);
const [usersPage, setUsersPage] = useState(1);
const [usersCount, setUsersCount] = useState(0);
const [hasUsersNextPage, setHasUsersNextPage] = useState(false);
const [hasUsersPreviousPage, setHasUsersPreviousPage] = useState(false);
const [confirmationChecked, setConfirmationChecked] = useState(false);
const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
const [previewTitle, setPreviewTitle] = useState("");
const [previewMessage, setPreviewMessage] = useState("");
const [audienceCounts, setAudienceCounts] = useState<AdminAudienceCounts>({
  all: 0,
  staff: 0,
  admin: 0,
  selected_users: 0,
});
const [currentBroadcastId, setCurrentBroadcastId] = useState<number | null>(null);
const [deliveryStatus, setDeliveryStatus] = useState<BroadcastJobStatusResponse | null>(null);

const parsedUserIds = useMemo(() => normalizeUserIds(userIdsInput), [userIdsInput]);
const selectedIdsForPayload = useMemo(
  () => (selectedUserIds.length > 0 ? selectedUserIds : parsedUserIds),
  [parsedUserIds, selectedUserIds],
);
const isAllVisibleSelected =
  users.length > 0 && users.every((user) => selectedUserIds.includes(user.id));

const targetAudienceCount = useMemo(() => {
  if (target === "all") {
    return audienceCounts.all;
  }
  if (target === "staff") {
    return audienceCounts.staff;
  }
  if (target === "admin") {
    return audienceCounts.admin;
  }
  return audienceCounts.selected_users;
}, [audienceCounts, target]);

const validation = useMemo<AdminBroadcastValidation>(() => {
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const hasTitle = trimmedTitle.length > 0;
  const hasMessage = trimmedMessage.length > 0;
  const validTitleLength = trimmedTitle.length <= TITLE_LIMIT;
  const validMessageLength = trimmedMessage.length <= MESSAGE_LIMIT;
  const hasUsersTarget =
    target !== "users" || (selectedIdsForPayload.length > 0 && targetAudienceCount > 0);

  return {
    trimmedTitle,
    trimmedMessage,
    hasTitle,
    hasMessage,
    validTitleLength,
    validMessageLength,
    hasUsersTarget,
  };
}, [message, selectedIdsForPayload.length, target, targetAudienceCount, title]);

const canSubmit =
  validation.hasTitle &&
  validation.hasMessage &&
  validation.validTitleLength &&
  validation.validMessageLength &&
  validation.hasUsersTarget &&
  targetAudienceCount > 0 &&
  confirmationChecked;

const loadAudienceCounts = useCallback(async () => {
  try {
    const counts = await getAudienceCounts(selectedIdsForPayload);
    setAudienceCounts(counts);
  } catch (countsError) {
    console.error("Failed to fetch audience counts", countsError);
  }
}, [selectedIdsForPayload]);

useEffect(() => {
  void loadAudienceCounts();
}, [loadAudienceCounts]);

useEffect(() => {
  const timeout = setTimeout(() => {
    setPreviewTitle(title.trim());
    setPreviewMessage(message.trim());
  }, 200);
  return () => clearTimeout(timeout);
}, [message, title]);

useEffect(() => {
  setUsersPage(1);
}, [search, roleFilter, target]);

useEffect(() => {
  if (target !== "users") {
    setSelectedUserIds([]);
    setUserIdsInput("");
  }
}, [target]);

useEffect(() => {
  if (target !== "users") {
    setUsers([]);
    setUsersCount(0);
    setHasUsersNextPage(false);
    setHasUsersPreviousPage(false);
    return;
  }

  const loadUsers = async () => {
    try {
      setIsUsersLoading(true);
      setUsersError(null);
      const data = await getAdminUsers({
        search,
        role: roleFilter,
        page: usersPage,
        pageSize: USERS_PAGE_SIZE,
      });
      setUsers(data.results);
      setUsersCount(data.count);
      setHasUsersNextPage(Boolean(data.next));
      setHasUsersPreviousPage(Boolean(data.previous));
    } catch (usersLoadError) {
      console.error("Failed to load users", usersLoadError);
      setUsersError("Failed to load users.");
    } finally {
      setIsUsersLoading(false);
    }
  };

  void loadUsers();
}, [roleFilter, search, target, usersPage]);

useEffect(() => {
  if (!currentBroadcastId || !deliveryStatus || isTerminalStatus(deliveryStatus.status)) {
    return;
  }

  const intervalId = window.setInterval(() => {
    void getBroadcastStatus(currentBroadcastId)
      .then((status) => {
        setDeliveryStatus(status);
      })
      .catch((statusError) => {
        console.error("Failed to poll broadcast status", statusError);
      });
  }, POLL_INTERVAL_MS);

  return () => window.clearInterval(intervalId);
}, [currentBroadcastId, deliveryStatus]);

const toggleSelectAll = useCallback(
  (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedUserIds((prev) => {
        const userIdSet = new Set(prev);
        for (const user of users) {
          userIdSet.add(user.id);
        }
        return Array.from(userIdSet);
      });
    } else {
      const currentPageIds = new Set(users.map((user) => user.id));
      setSelectedUserIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
    }
  },
  [users],
);

const toggleUserSelection = useCallback((userId: number, shouldSelect: boolean) => {
  setSelectedUserIds((prev) => {
    if (shouldSelect) {
      if (prev.includes(userId)) {
        return prev;
      }
      return [...prev, userId];
    }
    return prev.filter((id) => id !== userId);
  });
}, []);

const handleSubmit = useCallback(
  (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please complete all required fields and confirmation.");
      return;
    }
    setIsConfirmModalOpen(true);
  },
  [canSubmit],
);

const handleConfirmSend = useCallback(async () => {
  const payload: AdminNotificationPayload = {
    title: validation.trimmedTitle,
    message: validation.trimmedMessage,
    target,
    user_ids: target === "users" ? selectedIdsForPayload : undefined,
  };

  try {
    setIsSubmitting(true);
    setError(null);
    const response = await sendAdminNotification(payload);
    setCurrentBroadcastId(response.broadcast_id);
    const queuedStatus: BroadcastJobStatusResponse = {
      id: response.broadcast_id,
      status: response.status,
      recipient_count: response.recipient_count,
      delivered_count: 0,
      failed_count: 0,
      queued_at: response.queued_at,
      started_at: null,
      completed_at: null,
      task_id: response.task_id,
      updated_at: response.queued_at,
    };
    setDeliveryStatus(queuedStatus);
    const statusResponse = await getBroadcastStatus(response.broadcast_id);
    setDeliveryStatus(statusResponse);
  } catch (submitError) {
    console.error("Failed to send admin notification", submitError);
    setError(parseApiError(submitError));
  } finally {
    setIsSubmitting(false);
  }
}, [selectedIdsForPayload, target, validation.trimmedMessage, validation.trimmedTitle]);

const statusLabel = deliveryStatus?.status ?? "IDLE";
const statusTone =
  deliveryStatus?.status === "FAILED"
    ? "text-red-600"
    : deliveryStatus?.status === "PARTIAL"
    ? "text-amber-600"
    : deliveryStatus?.status === "COMPLETED"
    ? "text-emerald-600"
    : "text-indigo-600";

return {
  state: {
    formData: {
      title,
      message,
      target,
      userIdsInput,
      confirmationChecked,
    },
    users: {
      search,
      roleFilter,
      users,
      selectedUserIds,
      usersPage,
      usersCount,
      hasUsersNextPage,
      hasUsersPreviousPage,
      isAllVisibleSelected,
    },
    audience: {
      audienceCounts,
      targetAudienceCount,
      selectedIdsForPayload,
    },
    preview: {
      previewTitle,
      previewMessage,
    },
    delivery: {
      currentBroadcastId,
      deliveryStatus,
      statusLabel,
      statusTone,
    },
    validation,
    canSubmit,
    isConfirmModalOpen,
  },
  loading: {
    isSubmitting,
    isUsersLoading,
  },
  error: {
    form: error,
    users: usersError,
  },
  constants: {
    usersPageSize: USERS_PAGE_SIZE,
    titleLimit: TITLE_LIMIT,
    messageLimit: MESSAGE_LIMIT,
    targetOptions,
  },
  actions: {
    setTitle,
    setMessage,
    setTarget,
    setSearch,
    setRoleFilter,
    setUsersPage,
    setUserIdsInput,
    setConfirmationChecked,
    setConfirmModalOpen: setIsConfirmModalOpen,
    toggleSelectAll,
    toggleUserSelection,
    handleSubmit,
    handleConfirmSend,
  },
}; };
