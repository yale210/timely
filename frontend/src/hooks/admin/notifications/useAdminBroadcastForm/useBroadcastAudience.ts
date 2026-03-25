import { useEffect, useMemo, useState } from "react";
import { getAudienceCounts } from "@/api/notifications";
import {
  type AdminAudienceCounts,
  type AdminNotificationTarget,
} from "@/types";

const INITIAL_AUDIENCE_COUNTS: AdminAudienceCounts = { all: 0, staff: 0, admin: 0, selected_users: 0 };

const normalizeUserIds = (rawValue: string): number[] =>
  rawValue
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((v) => Number.isFinite(v) && v > 0);

const getTargetAudienceCount = (
  audienceCounts: AdminAudienceCounts,
  target: AdminNotificationTarget,
) => target === "all" ? audienceCounts.all : target === "staff" ? audienceCounts.staff : target === "admin" ? audienceCounts.admin : audienceCounts.selected_users;

const useAudienceCounts = (selectedIdsForPayload: number[]) => {
  const [audienceCounts, setAudienceCounts] = useState<AdminAudienceCounts>(INITIAL_AUDIENCE_COUNTS);

  useEffect(() => {
    let isMounted = true;
    const loadAudienceCounts = async () => {
      try {
        const counts = await getAudienceCounts(selectedIdsForPayload);
        if (isMounted) setAudienceCounts(counts);
      } catch (error) {
        console.error("Failed to fetch audience counts", error);
      }
    };
    void loadAudienceCounts();
    return () => { isMounted = false; };
  }, [selectedIdsForPayload]);

  return audienceCounts;
};

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
  const parsedUserIds = useMemo(() => normalizeUserIds(userIdsInput), [userIdsInput]);
  const selectedIdsForPayload = useMemo(() => selectedUserIds.length > 0 ? selectedUserIds : parsedUserIds, [parsedUserIds, selectedUserIds]);
  const audienceCounts = useAudienceCounts(selectedIdsForPayload);
  const targetAudienceCount = useMemo(() => getTargetAudienceCount(audienceCounts, target), [audienceCounts, target]);

  return { audienceCounts, targetAudienceCount, selectedIdsForPayload };
};
