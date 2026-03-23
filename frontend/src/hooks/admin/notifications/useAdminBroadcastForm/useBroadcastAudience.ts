import { useEffect, useMemo, useState } from "react";
import { getAudienceCounts } from "@/api/notifications";
import {
  type AdminAudienceCounts,
  type AdminNotificationTarget,
} from "@/types";

const normalizeUserIds = (rawValue: string): number[] =>
  rawValue
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((v) => Number.isFinite(v) && v > 0);

/**
 * Hook to manage audience counts and target selection for broadcast form.
 * @param target - The current notification target.
 * @param selectedUserIds - List of manually selected user IDs.
 * @param userIdsInput - Comma-separated user IDs input string.
 * @returns Audience related state and derived data.
 */
export const useBroadcastAudience = (
  target: AdminNotificationTarget,
  selectedUserIds: number[],
  userIdsInput: string
) => {
  const [audienceCounts, setAudienceCounts] = useState<AdminAudienceCounts>({
    all: 0,
    staff: 0,
    admin: 0,
    selected_users: 0,
  });

  const parsedUserIds = useMemo(() => normalizeUserIds(userIdsInput), [userIdsInput]);
  const selectedIdsForPayload = useMemo(
    () => (selectedUserIds.length > 0 ? selectedUserIds : parsedUserIds),
    [parsedUserIds, selectedUserIds]
  );

  const targetAudienceCount = useMemo(() => {
    if (target === "all") return audienceCounts.all;
    if (target === "staff") return audienceCounts.staff;
    if (target === "admin") return audienceCounts.admin;
    return audienceCounts.selected_users;
  }, [audienceCounts, target]);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const counts = await getAudienceCounts(selectedIdsForPayload);
        if (isMounted) setAudienceCounts(counts);
      } catch (err) {
        console.error("Failed to fetch audience counts", err);
      }
    };
    void fetchCounts();
    return () => { isMounted = false; };
  }, [selectedIdsForPayload]);

  return {
    audienceCounts,
    targetAudienceCount,
    selectedIdsForPayload,
  };
};
