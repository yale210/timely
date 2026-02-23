import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Themes from "../../src/pages/Themes";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../src/components/index.ts", () => ({
    ThemeButton: ({ title, themeChangeFunction }: any) => (
        <button onClick={() => themeChangeFunction(title)}>{title}</button>
    ),
    FontButton: ({ title, fontChangeFunction }: any) => (
        <button onClick={() => fontChangeFunction(title)}>{title}</button>
    ),
    AppNavbar: () => <nav>Navbar</nav>,
}));

describe("Themes Page", () => {
    it("renders themes and fonts sections", () => {
        render(
            <BrowserRouter>
                <Themes />
            </BrowserRouter>
        );

        expect(screen.getByText("Themes")).toBeDefined();
        expect(screen.getByText("Fonts")).toBeDefined();
        expect(screen.getByText("dark")).toBeDefined();
        expect(screen.getByText("poppins")).toBeDefined();
    });

    it("changes theme when theme button is clicked", () => {
        const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
        render(
            <BrowserRouter>
                <Themes />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText("dark"));
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(setItemSpy).toHaveBeenCalledWith("theme", "dark");
    });

    it("changes font when font button is clicked", () => {
        const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
        render(
            <BrowserRouter>
                <Themes />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText("pacifico"));
        expect(document.documentElement.dataset.font).toBe("pacifico");
        expect(setItemSpy).toHaveBeenCalledWith("font", "pacifico");
    });
});
