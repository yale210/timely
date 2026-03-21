import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableManualInput } from "@/components/admin/AdminUserTable/AdminUserTableManualInput";

describe("AdminUserTableManualInput Component", () => {
  const defaultProps = {
    userIdsInput: "1, 2, 3",
    isSubmitting: false,
    onUserIdsInputChange: vi.fn(),
  };

  it("renders correctly with initial input", () => {
    render(<AdminUserTableManualInput {...defaultProps} />);

    expect(screen.getByLabelText("Or paste user IDs")).toHaveValue("1, 2, 3");
  });

  it("calls onUserIdsInputChange when input changes", () => {
    const onUserIdsInputChange = vi.fn();
    render(<AdminUserTableManualInput {...defaultProps} onUserIdsInputChange={onUserIdsInputChange} />);

    const input = screen.getByLabelText("Or paste user IDs");
    fireEvent.change(input, { target: { value: "4, 5, 6" } });

    expect(onUserIdsInputChange).toHaveBeenCalledWith("4, 5, 6");
  });

  it("disables input when isSubmitting is true", () => {
    render(<AdminUserTableManualInput {...defaultProps} isSubmitting={true} />);

    expect(screen.getByLabelText("Or paste user IDs")).toBeDisabled();
  });
});
