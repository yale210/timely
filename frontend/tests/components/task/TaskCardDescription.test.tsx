import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import TaskCard from "@/components/tasks/TaskCard"

const mockTask = {
    id: 1,
    title: 'Test Task',
    start_time: new Date().toISOString(),
    deadline: new Date().toISOString(),
    importance: 5,
    estimated_minutes: 30,
    completed: false,
    categories: [],
    description: 'This is a long description that should be truncated by default but visible on hover. It needs to be long enough to show the "Show more" button if we have that logic based on length.'
}

describe('TaskCard Description', () => {
    const onToggleComplete = vi.fn()
    const onClick = vi.fn()

    afterEach(cleanup)

    it('should show description on hover', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={onToggleComplete} 
                onClick={onClick} 
            />
        )

        // Description should NOT be visible initially
        expect(screen.queryByText(mockTask.description)).toBeNull()

        // Hover over the card
        const card = screen.getByText('Test Task').closest('div[tabindex="0"]')!
        fireEvent.mouseEnter(card)

        // Description should now be visible
        expect(screen.getByText(mockTask.description)).toBeDefined()
    })

    it('should show description on focus', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={onToggleComplete} 
                onClick={onClick} 
            />
        )

        // Focus the card
        const card = screen.getByText('Test Task').closest('div[tabindex="0"]')!
        fireEvent.focus(card)

        // Description should be visible
        expect(screen.getByText(mockTask.description)).toBeDefined()
    })

    it('should toggle full description when "Show More" is clicked', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={onToggleComplete} 
                onClick={onClick} 
            />
        )

        // Hover to make description and "Show More" visible
        const card = screen.getByText('Test Task').closest('div[tabindex="0"]')!
        fireEvent.mouseEnter(card)

        const showMoreButton = screen.getByRole('button', { name: /Show More/i })
        expect(showMoreButton).toBeDefined()

        // Click show more
        fireEvent.click(showMoreButton)

        // Check if "Show Less" is now visible
        expect(screen.getByRole('button', { name: /Show Less/i })).toBeDefined()
        
        // Main onClick should NOT have been called (propagation stopped)
        expect(onClick).not.toHaveBeenCalled()
    })
})
