import { render, screen } from '@testing-library/react'
import { it, expect, describe, beforeEach } from 'vitest'
import { Footer } from '@/components'

describe('Footer', () => {
    beforeEach(() => {
        render(
            <Footer />
        )
    })

    it("renders footer description", () => {
        // Checks if the footer content loads
        const footerContent = screen.getByTestId("footer-content")
        expect(footerContent).toBeTruthy()
    })

})
