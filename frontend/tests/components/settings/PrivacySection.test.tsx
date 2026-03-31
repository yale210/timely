import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacySection from "@/components/settings/PrivacySection";

const openConfirmationModal = async (buttonName: RegExp) => {
  fireEvent.click(screen.getByRole("button", { name: buttonName }));
  return screen.findByRole("dialog");
};

describe("PrivacySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the privacy actions", async () => {
    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    expect(await screen.findByText("Privacy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete events/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("calls onDeleteEvents successfully after modal confirmation", async () => {
    const onDeleteEvents = vi.fn().mockResolvedValue("Events Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete events/i));
    fireEvent.click(dialog.getByRole("button", { name: /delete events/i }));

    expect(onDeleteEvents).toHaveBeenCalled();
    expect(await screen.findByText("Events Deleted")).toBeInTheDocument();
  });

  it("calls onDeleteTasks successfully after modal confirmation", async () => {
    const onDeleteTasks = vi.fn().mockResolvedValue("Tasks Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete tasks/i));
    fireEvent.click(dialog.getByRole("button", { name: /delete tasks/i }));

    expect(onDeleteTasks).toHaveBeenCalled();
    expect(await screen.findByText("Tasks Deleted")).toBeInTheDocument();
  });

  it("calls onDeleteAccount successfully after modal confirmation", async () => {
    const onDeleteAccount = vi.fn().mockResolvedValue("Account Deleted");

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete account/i));
    fireEvent.change(dialog.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(dialog.getByRole("button", { name: /delete account/i }));

    expect(onDeleteAccount).toHaveBeenCalledWith("secret");
    expect(await screen.findByText("Account Deleted")).toBeInTheDocument();
  });

  it("shows an error when deleting events fails", async () => {
    const onDeleteEvents = vi.fn().mockRejectedValue(new Error("failEvents"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete events/i));
    fireEvent.click(dialog.getByRole("button", { name: /delete events/i }));

    expect(onDeleteEvents).toHaveBeenCalled();
    expect(await screen.findByText("Failed to delete events.")).toBeInTheDocument();
  });

  it("shows an error when deleting tasks fails", async () => {
    const onDeleteTasks = vi.fn().mockRejectedValue(new Error("failTasks"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete tasks/i));
    fireEvent.click(dialog.getByRole("button", { name: /delete tasks/i }));

    expect(onDeleteTasks).toHaveBeenCalled();
    expect(await screen.findByText("Failed to delete tasks.")).toBeInTheDocument();
  });

  it("shows an error when deleting account fails", async () => {
    const onDeleteAccount = vi.fn().mockRejectedValue(new Error("failAccount"));

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete account/i));
    fireEvent.change(dialog.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(dialog.getByRole("button", { name: /delete account/i }));

    expect(onDeleteAccount).toHaveBeenCalledWith("secret");
    expect(await screen.findByText("Failed to delete account.")).toBeInTheDocument();
  });

  it("requires a password before deleting the account", async () => {
    const onDeleteAccount = vi.fn();

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete account/i));
    fireEvent.click(dialog.getByRole("button", { name: /delete account/i }));

    expect(onDeleteAccount).not.toHaveBeenCalled();
    expect(await screen.findByText("Please enter your password.")).toBeInTheDocument();
  });

  it("disables all action buttons when deleting", () => {
    render(
      <PrivacySection
        deleting={true}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /deleting/i });
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button).toBeDisabled());
  });

  it("does not call onDeleteEvents when the modal is cancelled", async () => {
    const onDeleteEvents = vi.fn();

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={onDeleteEvents}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete events/i));
    fireEvent.click(dialog.getByRole("button", { name: /cancel/i }));

    expect(onDeleteEvents).not.toHaveBeenCalled();
  });

  it("does not call onDeleteTasks when the modal is cancelled", async () => {
    const onDeleteTasks = vi.fn();

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={onDeleteTasks}
        onDeleteAccount={vi.fn()}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete tasks/i));
    fireEvent.click(dialog.getByRole("button", { name: /cancel/i }));

    expect(onDeleteTasks).not.toHaveBeenCalled();
  });

  it("does not call onDeleteAccount when the modal is cancelled", async () => {
    const onDeleteAccount = vi.fn();

    render(
      <PrivacySection
        deleting={false}
        onDeleteEvents={vi.fn()}
        onDeleteTasks={vi.fn()}
        onDeleteAccount={onDeleteAccount}
      />,
    );

    const dialog = within(await openConfirmationModal(/delete account/i));
    fireEvent.click(dialog.getByRole("button", { name: /cancel/i }));

    expect(onDeleteAccount).not.toHaveBeenCalled();
  });
});
