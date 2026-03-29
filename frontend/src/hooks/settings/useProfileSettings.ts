import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Profile } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import * as profileService from "@/services/profileService";

interface UseProfileState {
  profile: Profile | null;
  savedProfile: Profile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  avatarFile: File | null;
  isDirty: boolean;
}

const INITIAL_PROFILE_SETTINGS_STATE: UseProfileState = {
  profile: null,
  savedProfile: null,
  loading: false,
  saving: false,
  error: null,
  fieldErrors: {},
  avatarFile: null,
  isDirty: false,
};

function isProfileDirty(
  profile: Profile | null,
  savedProfile: Profile | null,
  avatarFile: File | null,
) {
  return JSON.stringify(profile) !== JSON.stringify(savedProfile) || avatarFile !== null;
}

function setProfileLoadingState(
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  setState((prev) => ({ ...prev, loading: true, error: null, fieldErrors: {} }));
}

function applyLoadedProfileState(
  profile: Profile,
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  setState((prev) => ({
    ...prev,
    profile,
    savedProfile: profile,
    loading: false,
    isDirty: false,
  }));
}

function applyProfileErrorState(
  error: unknown,
  setState: Dispatch<SetStateAction<UseProfileState>>,
  statusKey: "loading" | "saving",
) {
  const parsed = formatDjangoFormError(error);
  setState((prev) => ({
    ...prev,
    [statusKey]: false,
    error: parsed.message,
    fieldErrors: parsed.fieldErrors,
  }));
}

async function fetchProfileIntoState(
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  setProfileLoadingState(setState);

  try {
    const profile = await profileService.getMyProfile();
    applyLoadedProfileState(profile, setState);
  } catch (error) {
    applyProfileErrorState(error, setState, "loading");
  }
}

function useProfileState() {
  return useState<UseProfileState>(INITIAL_PROFILE_SETTINGS_STATE);
}

function useProfileLoadAction(
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  return useCallback(() => fetchProfileIntoState(setState), [setState]);
}

function useProfileLoadEffect(isActive: boolean, loadProfile: () => Promise<void>) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    void loadProfile();
  }, [isActive, loadProfile]);
}

function useSetProfileAction(
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  return useCallback((profile: Profile) => {
    setState((prev) => ({
      ...prev,
      profile,
      isDirty: isProfileDirty(profile, prev.savedProfile, prev.avatarFile),
    }));
  }, [setState]);
}

function useSetAvatarFileAction(
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  return useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      avatarFile: file,
      isDirty: isProfileDirty(prev.profile, prev.savedProfile, file),
    }));
  }, [setState]);
}

function useSaveProfileAction(
  state: UseProfileState,
  setState: Dispatch<SetStateAction<UseProfileState>>,
) {
  return useCallback(async () => {
    if (!state.profile) {
      return;
    }

    setState((prev) => ({ ...prev, saving: true, error: null, fieldErrors: {} }));

    try {
      const updated = await profileService.updateMyProfile(state.profile, state.avatarFile);
      setState((prev) => ({
        ...prev,
        profile: updated,
        savedProfile: updated,
        saving: false,
        avatarFile: null,
        isDirty: false,
      }));
    } catch (error) {
      applyProfileErrorState(error, setState, "saving");
    }
  }, [state.avatarFile, state.profile, setState]);
}

/**
 * Manages profile settings state and persistence.
 * @param isActive - Whether the profile section is active.
 */
export const useProfileSettings = (isActive: boolean) => {
  const [state, setState] = useProfileState();
  const loadProfile = useProfileLoadAction(setState);
  const setProfile = useSetProfileAction(setState);
  const setAvatarFile = useSetAvatarFileAction(setState);
  const saveProfile = useSaveProfileAction(state, setState);

  useProfileLoadEffect(isActive, loadProfile);

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
