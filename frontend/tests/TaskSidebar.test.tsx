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

    it('should not render delete button when id is 0 (new task)', () => {
        const initialData = {
            id: 0,
            title: "",
            description: "",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 5,
            completed: false,
            categories: [],
            estimated_minutes: 30,
        }
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={[]} 
                onSubmit={vi.fn()} 
                onDelete={vi.fn()}
                initialData={initialData}
            />
        )
        // Check that 'delete' material icon is NOT present
        expect(screen.queryByText('delete')).toBeNull()
        // Specifically check that "0" is not rendered (the bug reported)
        expect(screen.queryByText('0')).toBeNull()
    })
})