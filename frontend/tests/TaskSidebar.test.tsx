import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TaskSidebar } from "../src/components/index"

describe('TaskSidebar', () => {
    afterEach(cleanup)

    it('should not render when isOpen is false', () => {
        render(
            <TaskSidebar 
                isOpen={false} 
                onClose={vi.fn()} 
                categories={[]} 
                onSubmit={vi.fn()} 
            />
        )
        expect(screen.queryByText(/Add New Task/i)).toBeNull()
    })

    it('should render when isOpen is true', () => {
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={[]} 
                onSubmit={vi.fn()} 
            />
        )
        expect(screen.getByText(/Add New Task/i)).toBeDefined()
    })
})