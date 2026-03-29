import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as profileService from '@/services/profileService';
import type { Profile } from '@/types';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    patch: vi.fn(),
  }
}));

vi.mock('@/services/api', () => ({
  default: mockApi,
}));

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile: Profile = { 
    name: 'Test User',
    date_of_birth: null,
    creation_date: '',
    slogan: '',
    bio: 'Hello', 
    avatar: 'old.jpg'
  };

  describe('getMyProfile', () => {
    it('should call api.get with correct url', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: mockProfile });

      const result = await profileService.getMyProfile();

      expect(mockApi.get).toHaveBeenCalledWith('/api/profiles/');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateMyProfile', () => {
    it('should call api.patch without avatar', async () => {
      vi.mocked(mockApi.patch).mockResolvedValue({ data: mockProfile });
      
      const payload = { bio: 'Updated bio', avatar: 'ignore.jpg' };
      const result = await profileService.updateMyProfile(payload);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/profiles/', { bio: 'Updated bio' });
      expect(result).toEqual(mockProfile);
    });

    it('should call api.patch with FormData when avatarFile is provided', async () => {
      vi.mocked(mockApi.patch).mockResolvedValue({ data: mockProfile });
      
      const payload = { bio: 'Updated bio', nullValue: null, undefinedValue: undefined, avatar: 'ignore.jpg' };
      const file = new File(['content'], 'avatar.png', { type: 'image/png' });
      
      const result = await profileService.updateMyProfile(payload, file);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/profiles/', expect.any(FormData));
      
      const formData = vi.mocked(mockApi.patch).mock.calls[0][1] as FormData;
      expect(formData.get('bio')).toBe('Updated bio');
      expect(formData.get('nullValue')).toBeNull(); // Should be skipped based on code
      expect(formData.get('undefinedValue')).toBeNull(); // Should be skipped
      expect(formData.get('avatar')).toBe(file);
      
      expect(result).toEqual(mockProfile);
    });
  });
});
