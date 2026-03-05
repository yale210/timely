import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush } from '../../src/utils/pushNotifications';
import * as notificationsApi from '../../src/api/notifications';

vi.mock('../../src/api/notifications');

describe('pushNotifications utility', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('isPushSupported', () => {
        it('should return true when serviceWorker and PushManager exist', () => {
            vi.stubGlobal('navigator', { serviceWorker: {} });
            vi.stubGlobal('window', { PushManager: {} });
            expect(isPushSupported()).toBe(true);
            vi.unstubAllGlobals();
        });

        it('should return false when serviceWorker is missing', () => {
            vi.stubGlobal('navigator', {});
            vi.stubGlobal('window', { PushManager: {} });
            expect(isPushSupported()).toBe(false);
            vi.unstubAllGlobals();
        });
    });

    describe('subscribeUserToPush', () => {
        it('should throw error if push is not supported', async () => {
            vi.stubGlobal('navigator', {});
            await expect(subscribeUserToPush()).rejects.toThrow(/Push notifications are not supported/);
            vi.unstubAllGlobals();
        });

        it('should throw error if public key is missing', async () => {
            vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({}) } });
            vi.stubGlobal('window', { PushManager: {} });
            vi.mocked(notificationsApi.getVapidPublicKey).mockResolvedValueOnce({ public_key: '' });

            await expect(subscribeUserToPush()).rejects.toThrow(/Server did not return a VAPID public key/);
            vi.unstubAllGlobals();
        });

        it('should successfully subscribe and send to backend', async () => {
            const mockSubscription = {
                endpoint: 'mock-endpoint',
                toJSON: () => ({
                    endpoint: 'mock-endpoint',
                    keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' }
                })
            };

            const mockPushManager = {
                subscribe: vi.fn().mockResolvedValue(mockSubscription)
            };

            const mockRegistration = {
                pushManager: mockPushManager
            };

            vi.stubGlobal('navigator', {
                serviceWorker: { ready: Promise.resolve(mockRegistration) }
            });
            vi.stubGlobal('window', {
                PushManager: {},
                atob: (s: string) => s
            });

            vi.mocked(notificationsApi.getVapidPublicKey).mockResolvedValueOnce({ public_key: 'mock-public-key' });
            vi.mocked(notificationsApi.subscribeToPush).mockResolvedValueOnce(undefined);

            await subscribeUserToPush();

            expect(notificationsApi.getVapidPublicKey).toHaveBeenCalled();
            expect(mockPushManager.subscribe).toHaveBeenCalled();
            expect(notificationsApi.subscribeToPush).toHaveBeenCalledWith({
                endpoint: 'mock-endpoint',
                p256dh: 'mock-p256dh',
                auth: 'mock-auth'
            });
            
            vi.unstubAllGlobals();
        });

        it('should throw error if subscription is incomplete', async () => {
            const mockSubscription = {
                endpoint: 'mock-endpoint',
                toJSON: () => ({
                    endpoint: 'mock-endpoint',
                    keys: { p256dh: '', auth: 'mock-auth' } // missing p256dh
                })
            };

            const mockPushManager = {
                subscribe: vi.fn().mockResolvedValue(mockSubscription)
            };

            const mockRegistration = {
                pushManager: mockPushManager
            };

            vi.stubGlobal('navigator', {
                serviceWorker: { ready: Promise.resolve(mockRegistration) }
            });
            vi.stubGlobal('window', {
                PushManager: {},
                atob: (s: string) => s
            });

            vi.mocked(notificationsApi.getVapidPublicKey).mockResolvedValueOnce({ public_key: 'mock-public-key' });

            await expect(subscribeUserToPush()).rejects.toThrow(/Browser returned an incomplete push subscription/);
            
            vi.unstubAllGlobals();
        });
    });

    describe('unsubscribeUserFromPush', () => {
        it('should return if push is not supported', async () => {
            vi.stubGlobal('navigator', {});
            await unsubscribeUserFromPush();
            expect(notificationsApi.unsubscribeFromPush).not.toHaveBeenCalled();
            vi.unstubAllGlobals();
        });

        it('should successfully unsubscribe and notify backend', async () => {
            const mockSubscription = {
                endpoint: 'mock-endpoint',
                unsubscribe: vi.fn().mockResolvedValue(true)
            };

            const mockPushManager = {
                getSubscription: vi.fn().mockResolvedValue(mockSubscription)
            };

            const mockRegistration = {
                pushManager: mockPushManager
            };

            vi.stubGlobal('navigator', {
                serviceWorker: { ready: Promise.resolve(mockRegistration) }
            });
            vi.stubGlobal('window', {
                PushManager: {}
            });

            vi.mocked(notificationsApi.unsubscribeFromPush).mockResolvedValueOnce(undefined);

            await unsubscribeUserFromPush();

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
            expect(notificationsApi.unsubscribeFromPush).toHaveBeenCalledWith('mock-endpoint');
            
            vi.unstubAllGlobals();
        });

        it('should do nothing if no subscription exists', async () => {
             vi.stubGlobal('navigator', {
                serviceWorker: { ready: Promise.resolve({ pushManager: { getSubscription: () => null } }) }
            });
            vi.stubGlobal('window', { PushManager: {} });

            await unsubscribeUserFromPush();
            expect(notificationsApi.unsubscribeFromPush).not.toHaveBeenCalled();
            vi.unstubAllGlobals();
        });
    });
});
