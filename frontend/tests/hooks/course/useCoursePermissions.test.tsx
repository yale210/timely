import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoursePermissions } from '../../../src/hooks/course/useCoursePermissions';
import * as courseService from '../../../src/services/courseService';

vi.mock('../../../src/services/courseService', () => ({
  getCoursePermissions: vi.fn(),
}));

describe('useCoursePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default permissions when courseId is missing', () => {
    const { result } = renderHook(() => useCoursePermissions(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // Assuming default is some object
    expect(result.current.permissions).toBeDefined();
    expect(courseService.getCoursePermissions).not.toHaveBeenCalled();
  });

  it('fetches permissions when courseId is provided', async () => {
    const mockPermissions = { can_edit: true };
    vi.mocked(courseService.getCoursePermissions).mockResolvedValue(mockPermissions as any);

    const { result } = renderHook(() => useCoursePermissions(1));

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(courseService.getCoursePermissions).toHaveBeenCalledWith(1);
    expect(result.current.permissions).toEqual(mockPermissions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    vi.mocked(courseService.getCoursePermissions).mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useCoursePermissions(1));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Permission denied');
    // should fall back to default permissions
    expect(result.current.permissions).toBeDefined();
  });

  it('handles refresh', async () => {
    const mockPermissions = { can_edit: true };
    vi.mocked(courseService.getCoursePermissions).mockResolvedValue(mockPermissions as any);

    const { result } = renderHook(() => useCoursePermissions(1));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockPermissions2 = { can_edit: false };
    vi.mocked(courseService.getCoursePermissions).mockResolvedValue(mockPermissions2 as any);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.permissions).toEqual(mockPermissions2);
  });
  
  it('does nothing on refresh if no courseId', async () => {
    const { result } = renderHook(() => useCoursePermissions(null));
    
    await act(async () => {
      await result.current.refresh();
    });
    
    expect(courseService.getCoursePermissions).not.toHaveBeenCalled();
  });
});
