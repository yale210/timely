import { it, describe, expect, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Home } from "@/pages/index"
import { MemoryRouter } from 'react-router-dom'

describe('Home', () => {

    // Runs before every test, this renders the homepage
    beforeEach(() => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        )
    })

    // Runs after every test, ensures the DOM isn't rendered repeatedly
    afterEach(() => {
        cleanup()
    })
    
    it("renders the heading", () => {
        // Checks if the header "Plan Your Day" renders
        const heading = screen.getByRole("heading", { name: "Plan Your Day. Protect Your Time." })
        expect(heading).toBeTruthy()
    })

    it("renders the 'Get Started' link", () => {
        // Checks if the link "Get Started" renders
        const link = screen.getByRole("link", { name: "Get started" })
        expect(link).toBeTruthy()
    })

    it("renders the navigation menu", () => {
        // Checks if the navigation menu renders
        const navigationMenu = screen.getByTestId("navbar")
        expect(navigationMenu).toBeTruthy()
    })

    it("renders the footer", () => {
        // Checks if the footer renders
        const footer = screen.getByTestId("footer")
        expect(footer).toBeTruthy()
    })
})