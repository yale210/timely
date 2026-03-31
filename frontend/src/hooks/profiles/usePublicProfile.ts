import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { PublicProfile } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import { getPublicProfile } from "@/services/publicProfileService";

interface PublicProfileState {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PUBLIC_PROFILE_STATE: PublicProfileState = {
  profile: null,
  loading: false,
  error: null,
};

function queuePublicProfileReset(
  setState: Dispatch<SetStateAction<PublicProfileState>>,
  isActive: () => boolean,
) {
  queueMicrotask(() => {
    if (!isActive()) {
      return;
    }

    setState(EMPTY_PUBLIC_PROFILE_STATE);
  });
}

function queuePublicProfileLoading(
  setState: Dispatch<SetStateAction<PublicProfileState>>,
  isActive: () => boolean,
) {
  queueMicrotask(() => {
    if (!isActive()) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
  });
}

async function loadPublicProfile(
  username: string,
  setState: Dispatch<SetStateAction<PublicProfileState>>,
  isActive: () => boolean,
) {
  queuePublicProfileLoading(setState, isActive);

  try {
    const profile = await getPublicProfile(username);
    if (!isActive()) {
      return;
    }

    setState({ profile, loading: false, error: null });
  } catch (error) {
    const parsed = formatDjangoFormError(error);
    if (!isActive()) {
      return;
    }

    setState({ profile: null, loading: false, error: parsed.message });
  }
}

function usePublicProfileEffect(
  username: string | null,
  setState: Dispatch<SetStateAction<PublicProfileState>>,
) {
  useEffect(() => {
    let active = true;

    if (!username) {
      queuePublicProfileReset(setState, () => active);
      return () => {
        active = false;
      };
    }

    void loadPublicProfile(username, setState, () => active);
    return () => {
      active = false;
    };
  }, [username, setState]);
}

/**
 * Loads a public profile by username.
 * @param username - Username to query.
 */
export const usePublicProfile = (username: string | null) => {
  const [state, setState] = useState<PublicProfileState>(EMPTY_PUBLIC_PROFILE_STATE);
  usePublicProfileEffect(username, setState);

  return state;
};
