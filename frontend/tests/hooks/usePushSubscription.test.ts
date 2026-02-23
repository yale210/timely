import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePushSubscription } from '../../src/hooks/usePushSubscription';
import * as pushUtils from '../../src/utils/pushNotifications';

vi.mock('../../src/utils/pushNotifications');

describe('usePushSubscription', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubGlobal('Notification', { permission: 'default' });
    });

    it('should initialize with correct default state when supported', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(null)
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        
        expect(result.current.isSupported).toBe(true);
        expect(result.current.loading).toBe(false);
        
        await waitFor(() => expect(result.current.isSubscribed).toBe(false));
        expect(result.current.permission).toBe('default');
        vi.unstubAllGlobals();
    });

    it('should show as unsupported when push is not available', () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(false);
        
        const { result } = renderHook(() => usePushSubscription());
        
        expect(result.current.isSupported).toBe(false);
        expect(result.current.permission).toBe('unsupported');
    });

    it('should return false for checkSubscription if it throws', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.reject(new Error('SW failure'))
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.isSubscribed).toBe(false));
        vi.unstubAllGlobals();
    });

    it('should handle successful subscription', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.mocked(pushUtils.subscribeUserToPush).mockResolvedValue();
        
        const getSubscription = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ endpoint: 'test' });

        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.subscribe();
        });
        
        expect(pushUtils.subscribeUserToPush).toHaveBeenCalled();
        await waitFor(() => expect(result.current.isSubscribed).toBe(true));
        expect(result.current.error).toBeNull();
        vi.unstubAllGlobals();
    });

    it('should handle subscription error (Error instance)', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.mocked(pushUtils.subscribeUserToPush).mockRejectedValue(new Error('Subscription failed'));
        
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(null)
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.subscribe();
        });
        
        await waitFor(() => expect(result.current.error).toBe('Subscription failed'));
        vi.unstubAllGlobals();
    });

    it('should handle subscription error (non-Error)', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.mocked(pushUtils.subscribeUserToPush).mockRejectedValue('Strange error');
        
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue(null)
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.subscribe();
        });
        
        await waitFor(() => expect(result.current.error).toBe('Failed to enable push notifications.'));
        vi.unstubAllGlobals();
    });

    it('should handle unsubscription error (Error instance)', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.mocked(pushUtils.unsubscribeUserFromPush).mockRejectedValue(new Error('Unsubscribe failed'));
        
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue({ endpoint: 'test' })
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.isSubscribed).toBe(true));

        await act(async () => {
            await result.current.unsubscribe();
        });
        
        await waitFor(() => expect(result.current.error).toBe('Unsubscribe failed'));
        vi.unstubAllGlobals();
    });

    it('should handle unsubscription error (non-Error)', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(true);
        vi.mocked(pushUtils.unsubscribeUserFromPush).mockRejectedValue('Strange error');
        
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue({ endpoint: 'test' })
                    }
                })
            }
        });

        const { result } = renderHook(() => usePushSubscription());
        await waitFor(() => expect(result.current.isSubscribed).toBe(true));

        await act(async () => {
            await result.current.unsubscribe();
        });
        
        await waitFor(() => expect(result.current.error).toBe('Failed to disable push notifications.'));
        vi.unstubAllGlobals();
    });

    it('should return immediately if not supported on subscribe', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(false);
        const { result } = renderHook(() => usePushSubscription());
        await act(async () => {
            await result.current.subscribe();
        });
        expect(pushUtils.subscribeUserToPush).not.toHaveBeenCalled();
    });

    it('should return immediately if not supported on unsubscribe', async () => {
        vi.mocked(pushUtils.isPushSupported).mockReturnValue(false);
        const { result } = renderHook(() => usePushSubscription());
        await act(async () => {
            await result.current.unsubscribe();
        });
        expect(pushUtils.unsubscribeUserFromPush).not.toHaveBeenCalled();
    });
});
