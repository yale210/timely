import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useRecurrenceScopeActions } from "@/hooks/tasks/useRecurrenceScopeActions";

describe("useRecurrenceScopeActions Hook", () => {
  const mockOnSubmitEvent = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRevertToSeries = vi.fn();
  const mockOnClose = vi.fn();

  const mockEvent = {
    id: 1,
    title: "Recurring Event",
    recurrence_interval: "daily",
    start_time: "2023-01-01T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies recurring events correctly", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));
    expect(result.current.isEditingRecurringEvent).toBe(true);

    const { result: nonRecurring } = renderHook(() => useRecurrenceScopeActions({
        selectedEvent: { ...mockEvent, recurrence_interval: null } as any,
        onSubmitEvent: mockOnSubmitEvent,
        onClose: mockOnClose,
    }));
    expect(nonRecurring.current.isEditingRecurringEvent).toBe(false);
  });

  it("detects recurrence pattern changes", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));

    // No change
    expect(result.current.hasRecurrencePatternChanged({ recurrence_interval: "daily" } as any)).toBe(false);
    
    // Interval change
    expect(result.current.hasRecurrencePatternChanged({ recurrence_interval: "weekly" } as any)).toBe(true);
    
    // End date change
    expect(result.current.hasRecurrencePatternChanged({ recurrence_interval: "daily", recurrence_end: "2024-01-01" } as any)).toBe(true);
  });

  it("handles saving with 'this' scope", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openSaveScope({ title: "Updated" } as any);
    });

    expect(result.current.isScopeModalOpen).toBe(true);

    act(() => {
      result.current.handleScopeSelect("this");
    });

    expect(mockOnSubmitEvent).toHaveBeenCalledWith(
      { title: "Updated" },
      expect.objectContaining({ scope: "this" })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles saving with 'following' scope via advanced modal", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openSaveScope({ title: "Updated" } as any);
      result.current.handleScopeSelect("following");
    });

    expect(result.current.isScopeModalOpen).toBe(false);
    expect(result.current.isAdvancedScopeModalOpen).toBe(true);
    expect(result.current.pendingAdvancedScope).toBe("following");

    act(() => {
      result.current.scopeActionModalProps.onConfirm();
    });

    expect(mockOnSubmitEvent).toHaveBeenCalledWith(
      { title: "Updated" },
      expect.objectContaining({ scope: "following" })
    );
  });

  it("handles deletion with 'all' scope", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onDelete: mockOnDelete,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openDeleteScope();
      result.current.handleScopeSelect("all");
    });

    act(() => {
      result.current.scopeActionModalProps.onConfirm();
    });

    expect(mockOnDelete).toHaveBeenCalledWith(expect.objectContaining({ scope: "all" }));
  });

  it("prevents 'this' scope save if pattern changed", () => {
    const mockAlert = vi.fn();
    vi.stubGlobal("alert", mockAlert);

    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openSaveScope({ recurrence_interval: "weekly" } as any);
    });

    act(() => {
        result.current.handleScopeSelect("this");
    });

    expect(mockAlert).toHaveBeenCalled();
    expect(mockOnSubmitEvent).not.toHaveBeenCalled();
    
    vi.unstubAllGlobals();
  });

  it("handles revert to series", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onRevertToSeries: mockOnRevertToSeries,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openRevertModal();
    });
    expect(result.current.isRevertModalOpen).toBe(true);

    act(() => {
      result.current.performRevert();
    });

    expect(mockOnRevertToSeries).toHaveBeenCalledWith(expect.objectContaining({
      scope: "this",
      original_start_time: mockEvent.start_time
    }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes modals correctly", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
      selectedEvent: mockEvent as any,
      onSubmitEvent: mockOnSubmitEvent,
      onClose: mockOnClose,
    }));

    act(() => {
      result.current.openSaveScope({} as any);
      result.current.closeScopeModal();
    });
    expect(result.current.isScopeModalOpen).toBe(false);

    act(() => {
        result.current.openSaveScope({} as any);
        result.current.handleScopeSelect("all");
        result.current.closeAdvancedScopeModal(true); // Reopen selection
    });
    expect(result.current.isAdvancedScopeModalOpen).toBe(false);
    expect(result.current.isScopeModalOpen).toBe(true);
  });

  it("buildContext returns minimal context if event has no times", () => {
    const { result } = renderHook(() => useRecurrenceScopeActions({
        selectedEvent: { id: 1 } as any,
        onSubmitEvent: mockOnSubmitEvent,
        onClose: mockOnClose,
    }));
    const ctx = result.current.buildContext("all");
    expect(ctx).toEqual({ scope: "all" });
  });

  it("performRevert does nothing if onRevertToSeries is missing or event has no anchor", () => {
    const { result: noCallback } = renderHook(() => useRecurrenceScopeActions({
        selectedEvent: mockEvent as any,
        onSubmitEvent: mockOnSubmitEvent,
        onClose: mockOnClose,
    }));
    act(() => {
        noCallback.current.performRevert();
    });
    expect(mockOnRevertToSeries).not.toHaveBeenCalled();

    const { result: noAnchor } = renderHook(() => useRecurrenceScopeActions({
        selectedEvent: { id: 1 } as any,
        onSubmitEvent: mockOnSubmitEvent,
        onRevertToSeries: mockOnRevertToSeries,
        onClose: mockOnClose,
    }));
    act(() => {
        noAnchor.current.performRevert();
    });
    expect(mockOnRevertToSeries).not.toHaveBeenCalled();
  });
});
