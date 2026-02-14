import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, vi, expect } from "vitest";

vi.mock("@/services/statsService", () => ({
  getWeeklySummary: vi.fn(),
}));

import { getWeeklySummary } from "@/services/statsService";
import WeeklySummaries from "@/pages/WeeklySummaries";

describe("WeeklySummaries page", () => {
  it("fetches data on mount", async () => {
    vi.mocked(getWeeklySummary).mockResolvedValue({ total_tasks: 0, completed_tasks: 0, completion_percentage: 0, total_minutes_planned: 0 });
    render(<MemoryRouter><WeeklySummaries /></MemoryRouter>);
    await waitFor(() => expect(getWeeklySummary).toHaveBeenCalled());
  });
});
