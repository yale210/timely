import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PreferencesSection from "@/components/settings/PreferencesSection";
import * as specialDatesService from "@/services/specialDatesService";
import type { Preference } from "@/types";

vi.mock("@/services/specialDatesService", () => ({
  getSpecialDates: vi.fn(),
  createSpecialDate: vi.fn(),
  deleteSpecialDate: vi.fn(),
}));

const preference: Preference = {
  id: 1,
  day_start: "08:00:00",
  day_end: "22:00:00",
  max_hours_study_per_day: 4,
  days_off: [],
  day_schedule: [
    { day: 1, start: "08:00", end: "22:00" },
    { day: 2, start: "08:00", end: "22:00" },
    { day: 3, start: "08:00", end: "22:00" },
    { day: 4, start: "08:00", end: "22:00" },
    { day: 5, start: "08:00", end: "22:00" },
    { day: 6, start: "08:00", end: "22:00" },
    { day: 7, start: "08:00", end: "22:00" },
  ],
};

describe("PreferencesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads overrides and can add and remove a special date", async () => {
    const onPrefChange = vi.fn();
    vi.mocked(specialDatesService.getSpecialDates).mockResolvedValue([
      { id: 1, date: "2026-03-20", text: "Holiday" },
    ]);
    vi.mocked(specialDatesService.createSpecialDate).mockResolvedValue({
      id: 2,
      date: "2026-03-22",
      text: "Exam",
    });
    vi.mocked(specialDatesService.deleteSpecialDate).mockResolvedValue(undefined);

    render(
      <PreferencesSection
        pref={preference}
        prefLoading={false}
        prefSaving={false}
        prefError={null}
        fieldErrors={{}}
        onPrefChange={onPrefChange}
        onSave={vi.fn()}
      />,
    );

    expect(await screen.findByText("2026-03-20")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add date override/i }));
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-03-22" },
    });
    fireEvent.change(screen.getByLabelText("Label (optional)"), {
      target: { value: "Exam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(specialDatesService.createSpecialDate).toHaveBeenCalledWith({
        date: "2026-03-22",
        text: "Exam",
      }),
    );
    expect(await screen.findByText("2026-03-22")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove date override" })[0]);

    await waitFor(() =>
      expect(specialDatesService.deleteSpecialDate).toHaveBeenCalledWith(1),
    );
  });

  it("switches to per-day scheduling and toggles a day off", () => {
    const onPrefChange = vi.fn();
    vi.mocked(specialDatesService.getSpecialDates).mockResolvedValue([]);

    render(
      <PreferencesSection
        pref={preference}
        prefLoading={false}
        prefSaving={false}
        prefError={null}
        fieldErrors={{}}
        onPrefChange={onPrefChange}
        onSave={vi.fn()}
      />,
    );

    const scheduleToggleRow = screen.getByText("Set all days").parentElement!;
    fireEvent.click(within(scheduleToggleRow).getByRole("button"));

    const monRow = screen.getByText("Mon").parentElement!;
    fireEvent.click(within(monRow).getByRole("button"));

    expect(onPrefChange).toHaveBeenCalled();
  });
});
