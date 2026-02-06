import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { TaskSidebar } from "@/components/index"

describe('TaskSidebar', () => {
    afterEach(cleanup)

    const mockCategories = [
        { id: 1, text: 'Work' },
        { id: 2, text: 'Personal' }
    ]

    const mockTask = {
        id: 1,
        title: "Existing Task",
        description: "Task description",
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 5,
        completed: false,
        categories: [],
        estimated_minutes: 30,
    }

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
        expect(screen.queryByText('delete')).toBeNull()
        expect(screen.queryByText('0')).toBeNull()
    })

    it('should show Edit Task title when editing existing task', () => {
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={mockCategories} 
                onSubmit={vi.fn()} 
                onDelete={vi.fn()}
                initialData={mockTask}
            />
        )
        expect(screen.getByText(/Edit Task/i)).toBeDefined()
    })

    it('should render delete button when editing existing task', () => {
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={mockCategories} 
                onSubmit={vi.fn()} 
                onDelete={vi.fn()}
                initialData={mockTask}
            />
        )
        expect(screen.getByText('delete')).toBeDefined()
    })

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn()
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={onClose} 
                categories={[]} 
                onSubmit={vi.fn()} 
            />
        )
        const closeButton = screen.getByText('close')
        fireEvent.click(closeButton)
        expect(onClose).toHaveBeenCalled()
    })

    it('should open delete confirmation modal when delete clicked', async () => {
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={mockCategories} 
                onSubmit={vi.fn()} 
                onDelete={vi.fn()}
                initialData={mockTask}
            />
        )
        
        const deleteButton = screen.getByText('delete')
        fireEvent.click(deleteButton)
        
        await waitFor(() => {
            expect(screen.getByText(/Are you sure you want to delete/i)).toBeDefined()
        })
    })

    it('should call onDelete when deletion is confirmed', async () => {
        const onDelete = vi.fn()
        const onClose = vi.fn()
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={onClose} 
                categories={mockCategories} 
                onSubmit={vi.fn()} 
                onDelete={onDelete}
                initialData={mockTask}
            />
        )
        
        fireEvent.click(screen.getByText('delete'))
        
        await waitFor(() => {
            expect(screen.getByText(/Are you sure/i)).toBeDefined()
        })
        
        const confirmButton = screen.getByRole('button', { name: /Delete/i })
        fireEvent.click(confirmButton)
        
        expect(onDelete).toHaveBeenCalledWith(1)
        expect(onClose).toHaveBeenCalled()
    })

    it('should close delete modal when cancelled', async () => {
        render(
            <TaskSidebar 
                isOpen={true} 
                onClose={vi.fn()} 
                categories={mockCategories} 
                onSubmit={vi.fn()} 
                onDelete={vi.fn()}
                initialData={mockTask}
            />
        )
        
        fireEvent.click(screen.getByText('delete'))
        
        await waitFor(() => {
            expect(screen.getByText(/Are you sure/i)).toBeDefined()
        })
        
        const cancelButton = screen.getByRole('button', { name: /Cancel/i })
        fireEvent.click(cancelButton)
        
        await waitFor(() => {
            expect(screen.queryByText(/Are you sure/i)).toBeNull()
        })
    })
})