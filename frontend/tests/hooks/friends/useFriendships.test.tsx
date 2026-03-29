import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFriendships } from '@/hooks/friends/useFriendships';
import * as friendshipService from '@/services/friendshipService';
import type { Friendship } from '@/types';

vi.mock('@/services/friendshipService', () => ({
  getFriendships: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  deleteFriendship: vi.fn(),
}));

vi.mock('@/utils/apiErrors', () => ({
  formatDjangoFormError: vi.fn((err) => ({ message: err.message })),
}));

describe('useFriendships Hook', () => {
const mockFriendship: Friendship = { id: 1, sender: 1, receiver: 2, state: 'SENT' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const waitForEffects = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  };

  it('fetches friendships on mount', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);

    const { result } = renderHook(() => useFriendships());

    expect(result.current.loading).toBe(true);

    await waitForEffects();

    expect(friendshipService.getFriendships).toHaveBeenCalled();
    expect(result.current.friendships).toEqual([mockFriendship]);
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch error on mount', async () => {
    vi.mocked(friendshipService.getFriendships).mockRejectedValue(new Error('Fetch error'));

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    expect(result.current.error).toBe('Failed to load friendships');
    expect(result.current.loading).toBe(false);
  });

  it('sends friend request successfully', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    const newFriendship: Friendship = { id: 2, state: 'SENT', sender: 1, receiver: 2 };
    vi.mocked(friendshipService.sendFriendRequest).mockResolvedValue(newFriendship);

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.sendRequest('newuser');
    });

    expect(friendshipService.sendFriendRequest).toHaveBeenCalledWith('newuser');
    expect(result.current.friendships).toEqual([newFriendship]);
    expect(result.current.sending).toBe(false);
  });

  it('handles send friend request error', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    vi.mocked(friendshipService.sendFriendRequest).mockRejectedValue(new Error('Send error'));

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.sendRequest('newuser');
    });

    expect(result.current.error).toBe('Send error');
    expect(result.current.sending).toBe(false);
  });

  it('accepts a friend request optimistically', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    vi.mocked(friendshipService.acceptFriendRequest).mockResolvedValue();

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    let actPromise: Promise<void> | undefined;
    act(() => {
      actPromise = result.current.acceptRequest(1);
    });

    // Verify optimistic update
    expect(result.current.friendships[0].state).toBe('ACCEPTED');
    expect(result.current.actingIds.has(1)).toBe(true);

    await act(async () => {
      await actPromise;
    });

    expect(friendshipService.acceptFriendRequest).toHaveBeenCalledWith(1);
    expect(result.current.actingIds.has(1)).toBe(false);
  });

  it('rolls back on accept error', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    vi.mocked(friendshipService.acceptFriendRequest).mockRejectedValue(new Error('Accept error'));

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.acceptRequest(1);
    });

    expect(result.current.error).toBe('Failed to update friend request');
    expect(result.current.friendships[0].state).toBe('SENT'); // Rolled back
  });

  it('declines a friend request optimistically', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    vi.mocked(friendshipService.declineFriendRequest).mockResolvedValue();

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.declineRequest(1);
    });

    expect(friendshipService.declineFriendRequest).toHaveBeenCalledWith(1);
    expect(result.current.friendships[0].state).toBe('DECLINED');
  });

  it('removes a friend successfully', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    vi.mocked(friendshipService.deleteFriendship).mockResolvedValue();

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.removeFriend(1);
    });

    expect(friendshipService.deleteFriendship).toHaveBeenCalledWith(1);
    expect(result.current.friendships).toEqual([]);
  });

  it('handles remove friend error', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    vi.mocked(friendshipService.deleteFriendship).mockRejectedValue(new Error('Delete error'));

    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    await act(async () => {
      await result.current.removeFriend(1);
    });

    expect(result.current.error).toBe('Failed to remove friend');
    expect(result.current.friendships).toEqual([mockFriendship]);
  });

  it('listens to custom events for upsert', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    
    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    const newF: Friendship = { id: 3, state: 'SENT', sender: 1, receiver: 3 };
    
    act(() => {
      window.dispatchEvent(new CustomEvent('friendships-changed', {
        detail: { kind: 'upsert', friendship: newF }
      }));
    });

    expect(result.current.friendships).toContainEqual(newF);

    // Upsert existing
    const updatedF = { id: 3, state: 'ACCEPTED' };
    act(() => {
      window.dispatchEvent(new CustomEvent('friendships-changed', {
        detail: { kind: 'upsert', friendship: updatedF }
      }));
    });

    expect(result.current.friendships).toContainEqual(updatedF);
    expect(result.current.friendships).not.toContainEqual(newF);
  });

  it('listens to custom events for remove', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([mockFriendship]);
    
    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    act(() => {
      window.dispatchEvent(new CustomEvent('friendships-changed', {
        detail: { kind: 'remove', friendshipId: 1 }
      }));
    });

    expect(result.current.friendships).toEqual([]);
  });

  it('listens to custom events for bulk', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    
    const { result } = renderHook(() => useFriendships());

    await waitForEffects();

    const bulkF = [{ id: 4, state: 'ACCEPTED' }];
    act(() => {
      window.dispatchEvent(new CustomEvent('friendships-changed', {
        detail: { kind: 'bulk', friendships: bulkF }
      }));
    });

    expect(result.current.friendships).toEqual(bulkF);
  });

  it('refreshes on window focus', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    
    renderHook(() => useFriendships());

    await waitForEffects();

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(2);
  });

  it('refreshes on custom event without detail', async () => {
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    
    renderHook(() => useFriendships());

    await waitForEffects();

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('friendships-changed'));
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(2);
  });

  it('refreshes on interval', async () => {
    vi.useFakeTimers();
    vi.mocked(friendshipService.getFriendships).mockResolvedValue([]);
    
    renderHook(() => useFriendships());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });

    expect(friendshipService.getFriendships).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
  });
});
