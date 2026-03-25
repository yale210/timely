import { it, describe, expect, beforeEach, afterEach, vi} from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { About } from "@/pages/index"
import { FEATURES } from '@/components/about'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/hooks/common/useReveal', () => ({
    default: () => [{current: null}, true]
}))


describe('About', () => {

    beforeEach(() => {
        render(
            <MemoryRouter>
                <About />
            </MemoryRouter>
        )
    })

    afterEach(() => {
        cleanup()
    })

    it('about page renders without crashing', () => {
        expect(document.body).toBeTruthy()
    }) 

    it("navbar is rendered", () => {
        // Checks if the navigation menu renders
        const navBar= screen.getByTestId("navbar")
        expect(navBar).toBeTruthy()
    })

    it('renders the hero description', () => {
        expect(screen.getByText(/timely brings together task management/i)).toBeInTheDocument()
    })
  

    it('renders all feature sections', () => {
        for (const feature of FEATURES) {
            expect(screen.getByText(feature.title)).toBeInTheDocument()
        }
    })

    it("renders the 'Get Started' link", () => {
        const link = screen.getByRole("link", { name: "Get started" })
        expect(link).toBeTruthy()
    })

    it("renders the 'Create Free Account' link ", () => {
        const link = screen.getByRole("link", { name: "Create your free account" })
        expect(link).toBeTruthy()
    })

    it("render the 'Already have an account? log in' link", () => {
        const link = screen.getByRole("link", { name: "Already have an account? Log in" })
        expect(link).toBeTruthy()
    })

    
})

