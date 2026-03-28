import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as publicProfileService from '@/services/publicProfileService';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
  }
}));

vi.mock('@/services/api', () => ({
  default: mockApi,
}));

describe('publicProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublicProfile', () => {
    it('should call api.get with correct url', async () => {
      const mockProfile = { username: 'testuser', bio: 'Hello' };
      vi.mocked(mockApi.get).mockResolvedValue({ data: mockProfile });

      const result = await publicProfileService.getPublicProfile('testuser');

      expect(mockApi.get).toHaveBeenCalledWith('/api/profiles/testuser/');
      expect(result).toEqual(mockProfile);
    });
  });
});
