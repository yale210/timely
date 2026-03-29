import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCourseDetailStates } from "@/hooks/course/useCourseDetail";

describe("useCourseDetailStates", () => {
  it("returns the expected initial state", () => {
    const { result } = renderHook(() => useCourseDetailStates());

    expect(result.current.course).toBeNull();
    expect(result.current.leadUsername).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.eventsLoading).toBe(false);
    expect(result.current.error).toBeNull();

    expect(result.current.editOpen).toBe(false);
    expect(result.current.editSaving).toBe(false);
    expect(result.current.editError).toBeNull();
    expect(result.current.editForm).toEqual({
      name: "",
      description: "",
      active: true,
    });

    expect(result.current.eventOpen).toBe(false);
    expect(result.current.eventSaving).toBe(false);
    expect(result.current.eventError).toBeNull();
    expect(result.current.eventForm).toEqual({
      title: "",
      description: "",
      location: "",
      start_time: "",
      end_time: "",
    });

    expect(result.current.joinCodeOpen).toBe(false);
    expect(result.current.joinCodeSaving).toBe(false);
    expect(result.current.joinCodeError).toBeNull();
    expect(result.current.joinCodeResult).toBeNull();
    expect(result.current.joinCodeForm).toEqual({ expires_at: "" });

    expect(result.current.leaveLoading).toBe(false);
    expect(result.current.leaveError).toBeNull();
  });

  it("updates state through setters", () => {
    const { result } = renderHook(() => useCourseDetailStates());

    act(() => {
      result.current.setEditOpen(true);
      result.current.setLeaveError("Cannot leave");
      result.current.setJoinCodeResult("JOIN-1");
    });

    expect(result.current.editOpen).toBe(true);
    expect(result.current.leaveError).toBe("Cannot leave");
    expect(result.current.joinCodeResult).toBe("JOIN-1");
  });
});