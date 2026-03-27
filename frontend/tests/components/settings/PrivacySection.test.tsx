import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacySection from "@/components/settings/PrivacySection";

describe("PrivacySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rendering the page", async () => {

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
      />,
    );

    expect(await screen.findByText("Privacy")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /delete events/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /delete tasks/i })).toBeInTheDocument();
  });


  it("calls onDeleteEvents successfully", async () => {
    const onDeleteEvents = vi.fn().mockResolvedValue("Events Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
      />,
    );

    const deleteEventsButton  = screen.getByRole("button", { name: /Delete Events/i });
    fireEvent.click(deleteEventsButton);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /delete events/i }));

    expect(onDeleteEvents).toHaveBeenCalled();

    expect(await screen.findByText("Events Deleted")).toBeInTheDocument();
  });

  it("calls onDeleteTasks successfully", async () => {
    const onDeleteTasks = vi.fn().mockResolvedValue("Tasks Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
      />,
    );

    const deleteTasksButton  = screen.getByRole("button", { name: /Delete tasks/i });
    fireEvent.click(deleteTasksButton);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /delete tasks/i }));

    expect(onDeleteTasks).toHaveBeenCalled();

    expect(await screen.findByText("Tasks Deleted")).toBeInTheDocument();
  });

  it("error shown when onDeleteEvents fails", async () => {
    const onDeleteEvents = vi.fn().mockRejectedValue(new Error("failEvents?"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
      />,
    );

    const deleteEventsButton  = screen.getByRole("button", { name: /Delete Events/i });
    fireEvent.click(deleteEventsButton);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /delete events/i }));

    expect(onDeleteEvents).toHaveBeenCalled();

    expect(await screen.findByText("Failed to delete events.")).toBeInTheDocument();
  });

  it("error shown when onDeleteTasks fails", async () => {
    const onDeleteTasks = vi.fn().mockRejectedValue(new Error("failEvents?"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
      />,
    );

    const deleteTasksButton  = screen.getByRole("button", { name: /Delete Tasks/i });
    fireEvent.click(deleteTasksButton);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /delete tasks/i }));

    expect(onDeleteTasks).toHaveBeenCalled();

    expect(await screen.findByText("Failed to delete tasks.")).toBeInTheDocument();
  });

  it("Disables all buttons when deleting", () => {

    render(
      <PrivacySection
        deleting={true}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /Deleting/i })
    expect(buttons).toHaveLength(2);

    buttons.forEach((button) => expect(button).toBeDisabled());

    });
});
