import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGrades from "@/hooks/gradebook/useGrades";

describe("useGrades Hook", () => {
  const mockGrades = [
    { id: 1, name: "Test Grade 1", score: 80, total_possible: 100, date_achieved: "2023-01-01", category: 1, percentage: 80, time_spent_minutes: 60 },
    { id: 2, name: "Test Grade 2", score: 90, total_possible: 100, date_achieved: "2023-01-02", category: 2, percentage: 90, time_spent_minutes: 45 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Mock document.cookie for CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-token',
    });
  });

  it("should fetch grades on mount", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGrades),
    } as Response);

    const { result } = renderHook(() => useGrades());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.grades).toEqual(mockGrades);
    expect(global.fetch).toHaveBeenCalledWith("/api/grades/", expect.anything());
  });

  it("should handle fetch error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.grades).toEqual([]);
  });

  it("should handle fetch exception", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useGrades());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.grades).toEqual([]);
  });

  it("should filter grades by category", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGrades),
    } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSelectedCategoryId(1);
    });

    expect(result.current.filteredGrades).toHaveLength(1);
    expect(result.current.filteredGrades[0].id).toBe(1);

    act(() => {
      result.current.setSelectedCategoryId(null);
    });
    expect(result.current.filteredGrades).toHaveLength(2);
  });

  it("should open modal for editing", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGrades),
    } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleEditGrade(mockGrades[0]);
    });

    expect(result.current.modalOpen).toBe(true);
    expect(result.current.editInitial).toEqual({
      id: 1,
      name: "Test Grade 1",
      score: 80,
      total: 100,
      date: "2023-01-01",
      categoryId: 1,
    });

    act(() => {
      result.current.handleEditGrade({ ...mockGrades[0], category: undefined });
    });
    expect(result.current.editInitial?.categoryId).toBeNull();
  });

  it("should close modal and reset editInitial", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGrades),
    } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleEditGrade(mockGrades[0]);
    });

    expect(result.current.modalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.modalOpen).toBe(false);
    expect(result.current.editInitial).toBeNull();
  });

  it("should confirm delete and refresh grades", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGrades) } as Response) // Initial fetch
      .mockResolvedValueOnce({ ok: true } as Response) // DELETE request
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockGrades[1]]) } as Response); // Refresh fetch

    const { result } = renderHook(() => useGrades());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPendingDeleteId(1);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/grades/1/", expect.objectContaining({
      method: "DELETE",
      headers: { "X-CSRFToken": "test-token" }
    }));

    await waitFor(() => {
      expect(result.current.grades).toHaveLength(1);
      expect(result.current.grades![0].id).toBe(2);
    });
  });

  it("should handle delete without CSRF token", async () => {
    document.cookie = ""; // Clear cookies
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGrades) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPendingDeleteId(1);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/grades/1/", expect.objectContaining({
      method: "DELETE",
      headers: undefined
    }));
  });

  it("should do nothing if confirmDelete is called without pending ID", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGrades) } as Response);

    const { result } = renderHook(() => useGrades());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.confirmDelete();
    });

    // Only initial fetch should have been called
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
