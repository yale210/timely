import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { it, expect, describe, beforeEach, afterEach } from 'vitest'
import { HomeNavbar } from "@/components/index"
import { MemoryRouter } from 'react-router-dom'
import { NotificationProvider } from '@/context/NotificationContext'

describe('Navbar', () => {
    beforeEach(() => {
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <HomeNavbar />
                </NotificationProvider>
            </MemoryRouter>
        )
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the brand link to the homepage", () => {
        // Checks if the brand link 'Timely' redirects to the homepage
        const brand = screen.getByRole("link", {name: "Timely"})
        expect(brand.getAttribute("href")).toBe("/")
    })

    it("opens mobile menu when clicking 'Open main menu'", () => {
        // Checks if the button menu on smaller screen devices is displayed
        const openButton = screen.getByRole("button", { name: "Open main menu"})
        fireEvent.click(openButton)
        expect(screen.getByRole("button", { name: "Close menu"})).toBeTruthy()
    })
})