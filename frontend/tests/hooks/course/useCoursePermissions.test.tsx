import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCoursePermissions } from '@/hooks/course/useCoursePermissions';
import { getCoursePermissions } from '@/services/courseService';
import type { CoursePermissions } from '@/types/course';

vi.mock('@/services/courseService', () => ({
  getCoursePermissions: vi.fn(),
}));

const mockPermissions: CoursePermissions = {
  can_view_course_details: true,
  can_view_events: true,
  can_create_join_code: true,
  can_change_name: true,
  can_change_description: true,
  can_update_course: true,
  can_destroy_course: true,
  can_manage_staff: true,
  can_join: true,
  can_leave: true,
};

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
    expect(getCoursePermissions).not.toHaveBeenCalled();
  });

  it('fetches permissions when courseId is provided', async () => {
    vi.mocked(getCoursePermissions).mockResolvedValue(mockPermissions);

    const { result } = renderHook(() => useCoursePermissions(1));

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(getCoursePermissions).toHaveBeenCalledWith(1);
    expect(result.current.permissions).toEqual(mockPermissions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    vi.mocked(getCoursePermissions).mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useCoursePermissions(1));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Permission denied');
    // should fall back to default permissions
    expect(result.current.permissions).toBeDefined();
  });

  it('handles refresh', async () => {
    vi.mocked(getCoursePermissions).mockResolvedValue(mockPermissions);

    const { result } = renderHook(() => useCoursePermissions(1));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockPermissionsUpdated: CoursePermissions = { ...mockPermissions, can_update_course: false };
    vi.mocked(getCoursePermissions).mockResolvedValue(mockPermissionsUpdated);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.permissions).toEqual(mockPermissionsUpdated);
  });
  
  it('does nothing on refresh if no courseId', async () => {
    const { result } = renderHook(() => useCoursePermissions(null));
    
    await act(async () => {
      await result.current.refresh();
    });
    
    expect(getCoursePermissions).not.toHaveBeenCalled();
  });
});
