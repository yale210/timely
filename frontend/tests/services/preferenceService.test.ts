import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preferenceService } from '../../src/services/preferenceService';
import api from '../../src/services/api';
import type { Preference, PreferenceUpdate } from '../../src/types';

vi.mock('../../src/services/api');

describe('preferenceService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('getMyPreference should call the correct endpoint and return data', async () => {
        const mockPreference: Preference = {
            id: 1,
            day_start: '08:00:00',
            day_end: '22:00:00',
            max_hours_study_per_day: 4,
            days_off: [0, 6],
            user: 1
        };

        vi.mocked(api.get).mockResolvedValueOnce({ data: mockPreference });

        const result = await preferenceService.getMyPreference();

        expect(api.get).toHaveBeenCalledWith('/api/preferences/me/');
        expect(result).toEqual(mockPreference);
    });

    it('updateMyPreference should call patch and return updated data', async () => {
        const patch: PreferenceUpdate = {
            max_hours_study_per_day: 5
        };

        const mockPreference: Preference = {
            id: 1,
            day_start: '08:00:00',
            day_end: '22:00:00',
            max_hours_study_per_day: 5,
            days_off: [0, 6],
            user: 1
        };

        vi.mocked(api.patch).mockResolvedValueOnce({ data: mockPreference });

        const result = await preferenceService.updateMyPreference(patch);

        expect(api.patch).toHaveBeenCalledWith('/api/preferences/me/', patch);
        expect(result).toEqual(mockPreference);
    });
});
