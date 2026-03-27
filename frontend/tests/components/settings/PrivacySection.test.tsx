import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacySection from "@/components/settings/PrivacySection";

describe("PreferencesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("rendering the page", async () => {

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
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
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteEventsButton  = screen.getByRole("button", { name: /Delete Events/i });
    fireEvent.click(deleteEventsButton);

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
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteTasksButton  = screen.getByRole("button", { name: /Delete tasks/i });
    fireEvent.click(deleteTasksButton);

    expect(onDeleteTasks).toHaveBeenCalled();

    expect(await screen.findByText("Tasks Deleted")).toBeInTheDocument();
  });

  it("calls onDeleteAccount successfully", async () => {
    const onDeleteAccount = vi.fn().mockResolvedValue("Account Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const deleteAccountButton  = screen.getByRole("button", { name: /Delete accounT/i });
    fireEvent.click(deleteAccountButton);

    expect(onDeleteAccount).toHaveBeenCalled();

    expect(await screen.findByText("Account Deleted")).toBeInTheDocument();
  });

  it("error shown when onDeleteEvents fails", async () => {
    const onDeleteEvents = vi.fn().mockRejectedValue(new Error("failEvents?"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteEventsButton  = screen.getByRole("button", { name: /Delete Events/i });
    fireEvent.click(deleteEventsButton);

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
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteTasksButton  = screen.getByRole("button", { name: /Delete Tasks/i });
    fireEvent.click(deleteTasksButton);

    expect(onDeleteTasks).toHaveBeenCalled();

    expect(await screen.findByText("Failed to delete tasks.")).toBeInTheDocument();
  });

  it("error shown when onDeleteAccount fails", async () => {
    const onDeleteAccount = vi.fn().mockRejectedValue(new Error("failEvents?"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const deleteAccountButton  = screen.getByRole("button", { name: /Delete Account/i });
    fireEvent.click(deleteAccountButton);

    expect(onDeleteAccount).toHaveBeenCalled();

    expect(await screen.findByText("Failed to delete account.")).toBeInTheDocument();
  });

  it("Disables all buttons when deleting", () => {

    render(
      <PrivacySection
        deleting={true}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /Deleting/i })
    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => expect(button).toBeDisabled());

    });



    it("error shown when onDeleteAccount fails", async () => {
    const onDeleteAccount = vi.fn().mockRejectedValue(new Error("failEvents?"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const deleteAccountButton  = screen.getByRole("button", { name: /Delete Account/i });
    fireEvent.click(deleteAccountButton);

    expect(onDeleteAccount).toHaveBeenCalled();

    expect(await screen.findByText("Failed to delete account.")).toBeInTheDocument();
  });


  

  it("does not call onDeleteEvents when not confirmed", async () => {
    const onDeleteEvents = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteEventsButton  = screen.getByRole("button", { name: /Delete Events/i });
    fireEvent.click(deleteEventsButton);

    expect(onDeleteEvents).not.toHaveBeenCalled();

  });

  it("does not call onDeleteTasks when not confirmed", async () => {
    const onDeleteTasks = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
        onDeleteAccount={vi.fn()}
      />,
    );

    const deleteTasksButton  = screen.getByRole("button", { name: /Delete Tasks/i });
    fireEvent.click(deleteTasksButton);

    expect(onDeleteTasks).not.toHaveBeenCalled();

  });

  it("does not call onDeleteAccount when not confirmed", async () => {
    const onDeleteAccount = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const deleteAccountButton  = screen.getByRole("button", { name: /Delete Account/i });
    fireEvent.click(deleteAccountButton);

    expect(onDeleteAccount).not.toHaveBeenCalled();

  });
  
});
