import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlaceholderSection from "@/components/settings/PlaceholderSection";

describe("PlaceholderSection", () => {
  it("renders the title and description", () => {
    render(
      <PlaceholderSection
        title="Profile"
        description="Profile settings will go here."
      />,
    );

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Profile settings will go here.")).toBeInTheDocument();
  });
});
