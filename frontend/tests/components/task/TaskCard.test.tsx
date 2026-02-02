import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskCard } from "@/components/index"

describe('TaskCard', () => {
    afterEach(cleanup)

    const mockTask = {
        id: 1,
        title: 'Test Task',
        deadline: new Date().toISOString(),
        start_time: new Date().toISOString(),
        completed: false,
        importance: 8,
        estimated_minutes: 30,
        categories: [{ id: 1, text: 'Work' }]
    }

    it('should render task title and category', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={vi.fn()} 
                onClick={vi.fn()} 
            />
        )
        expect(screen.getByText(/Test Task/i)).toBeDefined()
        expect(screen.getByText(/Work/i)).toBeDefined()
    })

    it('should call onToggleComplete when checkbox clicked', () => {
        const onToggleComplete = vi.fn()
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={onToggleComplete} 
                onClick={vi.fn()} 
            />
        )
        const checkbox = screen.getByRole('checkbox')
        fireEvent.click(checkbox)
        expect(onToggleComplete).toHaveBeenCalledWith(1)
    })

    it('should render importance pill and estimated time', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={vi.fn()} 
                onClick={vi.fn()} 
            />
        )
        expect(screen.getByText(/High/i)).toBeDefined()
        expect(screen.getByText(/30m/i)).toBeDefined()
    })

    it('should show numeric importance on hover', () => {
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={vi.fn()} 
                onClick={vi.fn()} 
            />
        )
        const card = screen.getByText(/Test Task/i).closest('div.group')
        if (!card) throw new Error('Card not found')
        
        expect(screen.queryByText('8')).toBeNull()
        
        fireEvent.mouseEnter(card)
        expect(screen.getByText('8')).toBeDefined()
        expect(screen.queryByText(/High/i)).toBeNull()
        
        fireEvent.mouseLeave(card)
        expect(screen.getByText(/High/i)).toBeDefined()
        expect(screen.queryByText('8')).toBeNull()
    })
})