import { it, expect, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from "../src/pages/index"
import { MemoryRouter } from 'react-router-dom'

describe('Home', () => {
    it('should render the homepage', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        )
        screen.debug()
    })
})