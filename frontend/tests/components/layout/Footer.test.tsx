import { cleanup, render, screen } from '@testing-library/react'
import { it, expect, describe, beforeEach, afterEach } from 'vitest'
import { Footer } from '@/components'

describe('Footer', () => {
    beforeEach(() => {
        render(
            <Footer />
        )
    })

    afterEach(() => {
        cleanup()
    })

    it("renders footer description", () => {
        // Checks if the footer content loads
        const footerContent = screen.getByTestId("footer-content")
        expect(footerContent).toBeTruthy()
    })

})