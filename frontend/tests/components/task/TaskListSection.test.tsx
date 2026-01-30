import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
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
        }
    ]

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
        expect(screen.getByText("1")).toBeDefined()
    })
})