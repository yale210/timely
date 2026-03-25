import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsSidebar from "@/components/settings/SettingsSidebar";

describe("SettingsSidebar", () => {
  it("switches sections and confirms logout", () => {
    const selectSection = vi.fn();
    const logout = vi.fn();

    render(
      <SettingsSidebar
        state={{ activeSection: "general" }}
        loading={{ saving: false }}
        actions={{ selectSection, logout }}
      />,
    );

    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /profile/i }));
    expect(selectSection).toHaveBeenCalledWith("profile");

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Log out" })[1]);

    expect(logout).toHaveBeenCalled();
  });
});
