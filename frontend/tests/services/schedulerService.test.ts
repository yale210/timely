import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleTasks, unscheduleTasks, type ScheduleRequest } from '../../src/services/schedulerService';
import api from '../../src/services/api';
import { type ScheduleResponse } from '../../src/types';

vi.mock('../../src/services/api');

describe('schedulerService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('scheduleTasks should call /api/schedule/ and return data', async () => {
        const payload: ScheduleRequest = {
            start_date: '2023-01-01',
            max_days_ahead: 7
        };

        const mockResponse: ScheduleResponse = {
            scheduled_count: 5,
            results: [{ task_id: 1, success: true, scheduled_start: '2023-01-01T10:00:00', scheduled_end: '2023-01-01T11:00:00' }]
        };

        const spy = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockResponse });

        const result = await scheduleTasks(payload);

        expect(spy).toHaveBeenCalledWith('/api/schedule/', payload);
        expect(result).toEqual(mockResponse);
    });

    it('unscheduleTasks should call /api/unschedule/ and return count', async () => {
        const mockResponse = { unscheduled_count: 3 };

        const spy = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockResponse });

        const result = await unscheduleTasks();

        expect(spy).toHaveBeenCalledWith('/api/unschedule/');
        expect(result).toEqual(mockResponse);
    });
});
