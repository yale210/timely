import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePublicProfile } from '@/hooks/profiles/usePublicProfile';
import * as publicProfileService from '@/services/publicProfileService';
import type { PublicProfile } from '@/types';

vi.mock('@/services/publicProfileService', () => ({
  getPublicProfile: vi.fn(),
}));

vi.mock('@/utils/apiErrors', () => ({
  formatDjangoFormError: vi.fn((err) => ({ message: err.message })),
}));

describe('usePublicProfile Hook', () => {
    const mockProfile: PublicProfile = { username: 'testuser', name: 'Test User', bio: 'Hello', avatar_url: null, joined_at: '2026-01-01' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const waitForMicrotasks = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  };

  it('fetches profile when username is provided', async () => {
      vi.mocked(publicProfileService.getPublicProfile).mockResolvedValue(mockProfile);
    const { result } = renderHook(() => usePublicProfile('testuser'));

    // Initially loading might be false before the microtask runs, but after microtask it's true
    await waitForMicrotasks();

    expect(publicProfileService.getPublicProfile).toHaveBeenCalledWith('testuser');
    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('clears profile when username is null', async () => {
    const { result } = renderHook(() => usePublicProfile(null));

    await waitForMicrotasks();

    expect(publicProfileService.getPublicProfile).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it('handles fetch error', async () => {
    vi.mocked(publicProfileService.getPublicProfile).mockRejectedValue(new Error('User not found'));

    const { result } = renderHook(() => usePublicProfile('invaliduser'));

    await waitForMicrotasks();

    expect(publicProfileService.getPublicProfile).toHaveBeenCalledWith('invaliduser');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('User not found');
    expect(result.current.profile).toBeNull();
  });

  it('aborts state update if unmounted during fetch', async () => {
    let resolveFetch: (val: PublicProfile) => void;
    vi.mocked(publicProfileService.getPublicProfile).mockImplementation(() => {
      return new Promise<PublicProfile>(_resolve => {
        resolveFetch = _resolve;
      });
    });

    const { result, unmount } = renderHook(() => usePublicProfile('testuser'));

    // Let the microtask setting loading to true run
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolveFetch(mockProfile);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The state should not be updated to the profile because it was unmounted
    expect(result.current.profile).toBeNull();
  });

  it('aborts state update if unmounted during error', async () => {
    let rejectFetch: (err: unknown) => void;
    vi.mocked(publicProfileService.getPublicProfile).mockImplementation(() => {
      return new Promise<PublicProfile>((_, _reject) => {
        rejectFetch = _reject;
      });
    });

    const { result, unmount } = renderHook(() => usePublicProfile('testuser'));

    // Let the microtask setting loading to true run
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      rejectFetch(new Error('Error'));
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The state should not be updated to error because it was unmounted
    expect(result.current.error).toBeNull();
  });
  
  it('aborts state update if unmounted when username is null', async () => {
    const { result, unmount } = renderHook(() => usePublicProfile(null));

    unmount();

    await waitForMicrotasks();

    // The microtask should not run state update
    expect(result.current.profile).toBeNull();
  });
});
