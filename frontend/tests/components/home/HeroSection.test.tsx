import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HeroSection from "@/components/home/HeroSection";

describe("HeroSection", () => {
  it("renders the hero content, actions, and image", () => {
    render(
      <MemoryRouter>
        <HeroSection>
          <div>Extra banner</div>
        </HeroSection>
      </MemoryRouter>,
    );

    expect(screen.getByText("Extra banner")).toBeInTheDocument();
    expect(screen.getByText(/Plan Your Day/i)).toBeInTheDocument();
    expect(
      screen.getByAltText("Person managing schedule"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
