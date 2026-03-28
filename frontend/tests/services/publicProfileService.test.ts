import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as publicProfileService from '../../src/services/publicProfileService';
import api from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('publicProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublicProfile', () => {
    it('should call api.get with correct url', async () => {
      const mockProfile = { username: 'testuser', bio: 'Hello' };
      vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

      const result = await publicProfileService.getPublicProfile('testuser');

      expect(api.get).toHaveBeenCalledWith('/api/profiles/testuser/');
      expect(result).toEqual(mockProfile);
    });
  });
});
