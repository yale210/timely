import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskListSection } from "@/components/index"

describe('TaskListSection', () => {
    afterEach(cleanup)

    const mockTasks = [
        {
            id: 1,
            title: 'Task 1',
            deadline: new Date().toISOString(),
            start_time: new Date().toISOString(),
            completed: false,
            importance: 5,
            estimated_minutes: 30,
            categories: []
        },
        {
            id: 2,
            title: 'Task 2',
            deadline: new Date().toISOString(),
            start_time: new Date().toISOString(),
            completed: false,
            importance: 7,
            estimated_minutes: 45,
            categories: []
        }
    ]

    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        deadline: new Date().toISOString(),
        start_time: new Date().toISOString(),
        completed: false,
        importance: 5,
        estimated_minutes: 30,
        categories: []
    }))

    it('should render title and count', () => {
        render(
            <TaskListSection 
                title="Today" 
                tasks={mockTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
            />
        )
        expect(screen.getByText(/Today/i)).toBeDefined()
        expect(screen.getByText("2")).toBeDefined()
    })

    it('should render empty message when no tasks', () => {
        render(
            <TaskListSection 
                title="Today" 
                tasks={[]} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
            />
        )
        expect(screen.getByText(/No tasks in this section/i)).toBeDefined()
    })

    it('should show View More button when more tasks than initialVisible', () => {
        render(
            <TaskListSection 
                title="Today" 
                tasks={manyTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
                initialVisible={3}
            />
        )
        expect(screen.getByText(/View More/i)).toBeDefined()
        expect(screen.getByText(/Task 1/i)).toBeDefined()
        expect(screen.getByText(/Task 3/i)).toBeDefined()
        expect(screen.queryByText(/Task 4/i)).toBeNull()
    })

    it('should expand tasks when View More clicked', () => {
        render(
            <TaskListSection 
                title="Today" 
                tasks={manyTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
                initialVisible={3}
            />
        )
        
        fireEvent.click(screen.getByText(/View More/i))
        expect(screen.getByText(/Task 4/i)).toBeDefined()
        expect(screen.getByText(/Task 6/i)).toBeDefined()
    })

    it('should be collapsible when isCollapsible is true', () => {
        render(
            <TaskListSection 
                title="Past Tasks" 
                tasks={mockTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
                isCollapsible={true}
            />
        )
        
        expect(screen.getByText(/Task 1/i)).toBeDefined()
        
        const header = screen.getByText(/Past Tasks/i).closest('div')
        if (!header) throw new Error('Header not found')
        fireEvent.click(header)
        
        expect(screen.queryByText(/Task 1/i)).toBeNull()
    })

    it('should start collapsed when defaultCollapsed is true', () => {
        render(
            <TaskListSection 
                title="Past Tasks" 
                tasks={mockTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={vi.fn()} 
                isCollapsible={true}
                defaultCollapsed={true}
            />
        )
        
        expect(screen.queryByText(/Task 1/i)).toBeNull()
        
        const header = screen.getByText(/Past Tasks/i).closest('div')
        if (!header) throw new Error('Header not found')
        fireEvent.click(header)
        
        expect(screen.getByText(/Task 1/i)).toBeDefined()
    })

    it('should call onToggleComplete when task checkbox clicked', () => {
        const onToggleComplete = vi.fn()
        render(
            <TaskListSection 
                title="Today" 
                tasks={mockTasks} 
                onToggleComplete={onToggleComplete} 
                onTaskClick={vi.fn()} 
            />
        )
        
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])
        expect(onToggleComplete).toHaveBeenCalledWith(1)
    })

    it('should call onTaskClick when task card clicked', () => {
        const onTaskClick = vi.fn()
        render(
            <TaskListSection 
                title="Today" 
                tasks={mockTasks} 
                onToggleComplete={vi.fn()} 
                onTaskClick={onTaskClick} 
            />
        )
        
        const taskCard = screen.getByText(/Task 1/i).closest('div.group')
        if (!taskCard) throw new Error('Task card not found')
        fireEvent.click(taskCard)
        expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0])
    })
})