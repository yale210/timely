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
        expect(screen.getByText(/^High$/i)).toBeDefined()
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
        expect(screen.queryByText(/^High$/i)).toBeNull()
        
        fireEvent.mouseLeave(card)
        expect(screen.getByText(/^High$/i)).toBeDefined()
        expect(screen.queryByText('8')).toBeNull()
    })

    it('should call onClick when card is clicked', () => {
        const onClick = vi.fn()
        render(
            <TaskCard 
                task={mockTask} 
                onToggleComplete={vi.fn()} 
                onClick={onClick} 
            />
        )
        const card = screen.getByText(/Test Task/i).closest('div.group')
        if (!card) throw new Error('Card not found')
        fireEvent.click(card)
        expect(onClick).toHaveBeenCalledWith(mockTask)
    })

    it('should display Very Low importance for level 1', () => {
        const task = { ...mockTask, importance: 1 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Very low/i)).toBeDefined()
    })

    it('should display Low importance for level 2', () => {
        const task = { ...mockTask, importance: 2 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/^Low$/i)).toBeDefined()
    })

    it('should display Low-medium importance for level 3', () => {
        const task = { ...mockTask, importance: 3 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Low-medium/i)).toBeDefined()
    })

    it('should display Medium-low importance for level 4', () => {
        const task = { ...mockTask, importance: 4 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Medium-low/i)).toBeDefined()
    })

    it('should display Medium importance for level 5', () => {
        const task = { ...mockTask, importance: 5 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/^Medium$/i)).toBeDefined()
    })

    it('should display Medium-high importance for level 6', () => {
        const task = { ...mockTask, importance: 6 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Medium-high/i)).toBeDefined()
    })

    it('should display High-medium importance for level 7', () => {
        const task = { ...mockTask, importance: 7 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/High-medium/i)).toBeDefined()
    })

    it('should display Very high importance for level 9', () => {
        const task = { ...mockTask, importance: 9 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Very high/i)).toBeDefined()
    })

    it('should display Critical importance for level 10', () => {
        const task = { ...mockTask, importance: 10 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Critical/i)).toBeDefined()
    })

    it('should display default Medium importance for invalid value', () => {
        const task = { ...mockTask, importance: 99 }
        render(<TaskCard task={task} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/^Medium$/i)).toBeDefined()
    })

    it('should show Overdue for past incomplete tasks', () => {
        const pastTask = { 
            ...mockTask, 
            deadline: new Date(Date.now() - 86400000).toISOString(),
            completed: false 
        }
        render(<TaskCard task={pastTask} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.getByText(/Overdue/i)).toBeDefined()
    })

    it('should show completed task with strikethrough', () => {
        const completedTask = { ...mockTask, completed: true }
        render(<TaskCard task={completedTask} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        const title = screen.getByText(/Test Task/i)
        expect(title.className).toContain('line-through')
    })

    it('should not show estimated time when zero', () => {
        const taskNoTime = { ...mockTask, estimated_minutes: 0 }
        render(<TaskCard task={taskNoTime} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        expect(screen.queryByText(/0m/i)).toBeNull()
    })

    it('should toggle Show More/Less for long description', () => {
        const longDescription = "This is a very long description that exceeds 60 characters and should show the expand/collapse button."
        const taskWithLongDesc = { ...mockTask, description: longDescription }
        render(<TaskCard task={taskWithLongDesc} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        
        const card = screen.getByText(/Test Task/i).closest('div.group')
        if (!card) throw new Error('Card not found')
        
        fireEvent.mouseEnter(card)
        expect(screen.getByText(/Show More/i)).toBeDefined()
        
        fireEvent.click(screen.getByText(/Show More/i))
        expect(screen.getByText(/Show Less/i)).toBeDefined()
        
        fireEvent.click(screen.getByText(/Show Less/i))
        expect(screen.getByText(/Show More/i)).toBeDefined()
    })

    it('should handle focus and blur events', () => {
        render(<TaskCard task={mockTask} onToggleComplete={vi.fn()} onClick={vi.fn()} />)
        const card = screen.getByText(/Test Task/i).closest('div.group')
        if (!card) throw new Error('Card not found')
        
        fireEvent.focus(card)
        expect(screen.getByText('8')).toBeDefined()
        
        fireEvent.blur(card)
        expect(screen.getByText(/^High$/i)).toBeDefined()
    })
})
