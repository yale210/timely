import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminBroadcastForm } from "@/components/admin/notifications/AdminBroadcastForm";
import type { AdminNotificationTarget, AdminUserRole, AdminUserSummary } from "@/types";

vi.mock("@/components/admin/AdminUserTable", () => ({
  AdminUserTable: (props: {
    target: string;
    onSearchChange: (value: string) => void;
  }) => (
    <div data-testid="admin-user-table">
      <span>{props.target}</span>
      <button type="button" onClick={() => props.onSearchChange("alice")}>
        Search users
      </button>
    </div>
  ),
}));

const createProps = () => ({
  title: "Semester update",
  message: "Classes resume next week.",
  target: "all" as AdminNotificationTarget,
  userIdsInput: "",
  confirmationChecked: false,
  audienceCounts: {
    all: 12,
    staff: 3,
    admin: 1,
    selected_users: 0,
  },
  targetAudienceCount: 12,
  users: [] as AdminUserSummary[],
  selectedUserIds: [],
  usersPage: 1,
  usersCount: 0,
  usersPageSize: 10,
  search: "",
  roleFilter: "all" as AdminUserRole,
  hasUsersNextPage: false,
  hasUsersPreviousPage: false,
  isAllVisibleSelected: false,
  isSubmitting: false,
  isUsersLoading: false,
  usersError: null,
  titleLimit: 40,
  messageLimit: 140,
  canSubmit: true,
  error: null,
  targetOptions: [
    { label: "All users", value: "all" as AdminNotificationTarget },
    { label: "Staff", value: "staff" as AdminNotificationTarget },
  ],
  onSubmit: vi.fn(),
  onTitleChange: vi.fn(),
  onMessageChange: vi.fn(),
  onTargetChange: vi.fn(),
  onConfirmationChange: vi.fn(),
  onSearchChange: vi.fn(),
  onRoleFilterChange: vi.fn(),
  onUsersPageChange: vi.fn(),
  onToggleSelectAll: vi.fn(),
  onToggleUserSelection: vi.fn(),
  onUserIdsInputChange: vi.fn(),
});

describe("AdminBroadcastForm", () => {
  it("renders counters, forwards changes, and submits", () => {
    const props = createProps();

    render(<AdminBroadcastForm {...props} />);

    expect(screen.getByText("Estimated recipients: 12")).toBeInTheDocument();
    expect(screen.getByText("15/40")).toBeInTheDocument();
    expect(screen.getByTestId("admin-user-table")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New title" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "New message" },
    });
    fireEvent.change(screen.getByLabelText("Target audience"), {
      target: { value: "staff" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Search users"));
    fireEvent.submit(screen.getByRole("button", { name: "Send notification" }).closest("form")!);

    expect(props.onTitleChange).toHaveBeenCalledWith("New title");
    expect(props.onMessageChange).toHaveBeenCalledWith("New message");
    expect(props.onTargetChange).toHaveBeenCalledWith("staff");
    expect(props.onConfirmationChange).toHaveBeenCalledWith(true);
    expect(props.onSearchChange).toHaveBeenCalledWith("alice");
    expect(props.onSubmit).toHaveBeenCalled();
  });
});
