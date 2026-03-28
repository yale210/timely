import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as friendshipService from '../../src/services/friendshipService';
import api from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('friendshipService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFriendship = { id: 1, state: 'PENDING', receiver: 'testuser' };

  describe('getFriendships', () => {
    it('should call api.get with correct url', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockFriendship] });

      const result = await friendshipService.getFriendships();

      expect(api.get).toHaveBeenCalledWith('/api/friendships/');
      expect(result).toEqual([mockFriendship]);
    });
  });

  describe('sendFriendRequest', () => {
    it('should call api.post with correct data', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: mockFriendship });

      const result = await friendshipService.sendFriendRequest('testuser');

      expect(api.post).toHaveBeenCalledWith('/api/friendships/', { receiver_username: 'testuser' });
      expect(result).toEqual(mockFriendship);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should call api.post with correct url', async () => {
      vi.mocked(api.post).mockResolvedValue({});

      await friendshipService.acceptFriendRequest(1);

      expect(api.post).toHaveBeenCalledWith('/api/friendships/1/accept/');
    });
  });

  describe('declineFriendRequest', () => {
    it('should call api.post with correct url', async () => {
      vi.mocked(api.post).mockResolvedValue({});

      await friendshipService.declineFriendRequest(1);

      expect(api.post).toHaveBeenCalledWith('/api/friendships/1/decline/');
    });
  });

  describe('deleteFriendship', () => {
    it('should call api.delete with correct url', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await friendshipService.deleteFriendship(1);

      expect(api.delete).toHaveBeenCalledWith('/api/friendships/1/');
    });
  });
});
