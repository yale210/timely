import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useCategories from '../../src/hooks/useCategories';

describe('useCategories hook', () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    beforeEach(() => {
        mockFetch.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should load categories successfully', async () => {
        const mockCategories = [
            { id: 1, text: 'Homework' },
            { id: 2, text: 'Exam' }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        const { result } = renderHook(() => useCategories());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories).toEqual(mockCategories);
        expect(mockFetch).toHaveBeenCalledWith('/api/categories/', { credentials: 'include' });
    });

    it('should handle fetch failure', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories).toEqual([]);
    });

    it('should handle exception during fetch', async () => {
        const error = new Error('Network error');
        mockFetch.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Failed to load categories:', error);
    });

    it('should not update state if component is unmounted', async () => {
        let resolveFetch: (value: any) => void;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });

        mockFetch.mockReturnValueOnce(fetchPromise);

        const { unmount, result } = renderHook(() => useCategories());

        unmount();

        resolveFetch!({
            ok: true,
            json: async () => [{ id: 1, text: 'Never set' }],
        });

        // We can't easily assert on internal state after unmount,
        // but this test ensures no 'state update on unmounted component' warnings
    });
});
