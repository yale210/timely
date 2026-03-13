import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import * as profileService from "@/services/profileService";

interface UseProfileState {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  avatarFile: File | null;
}

export const useProfileSettings = (isActive: boolean) => {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: false,
    saving: false,
    error: null,
    fieldErrors: {},
    avatarFile: null,
  });

  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, fieldErrors: {} }));
    try {
      const profile = await profileService.getMyProfile();
      setState((prev) => ({ ...prev, profile, loading: false }));
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      }));
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void loadProfile();
  }, [isActive, loadProfile]);

  const setProfile = (profile: Profile) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const setAvatarFile = (file: File | null) => {
    setState((prev) => ({ ...prev, avatarFile: file }));
  };

  const saveProfile = useCallback(async () => {
    if (!state.profile) return;

    setState((prev) => ({ ...prev, saving: true, error: null, fieldErrors: {} }));
    try {
      const updated = await profileService.updateMyProfile(state.profile, state.avatarFile);
      setState((prev) => ({
        ...prev,
        profile: updated,
        saving: false,
        avatarFile: null,
      }));
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      }));
    }
  }, [state.profile, state.avatarFile]);

  return {
    state,
    actions: {
      setProfile,
      setAvatarFile,
      saveProfile,
      reload: loadProfile,
    },
  };
};
