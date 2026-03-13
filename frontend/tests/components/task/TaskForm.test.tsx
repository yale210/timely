import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskForm } from "@/components/index"
import { type TaskSubmission } from '@/types'

describe('TaskForm', () => {
    afterEach(cleanup)
    
    const categories = [
        { id: 1, text: 'Work' },
        { id: 2, text: 'Personal' }
    ]
    const createCategory = vi.fn().mockResolvedValue({ id: 3, text: "New" })
    const updateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" })
    const deleteCategory = vi.fn().mockResolvedValue(undefined)

    it('should render form fields', async () => {
        render(
            <TaskForm 
                categories={categories} 
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                onSubmit={vi.fn()} 
                onCancel={vi.fn()} 
            />
        )
        
        expect(screen.getByLabelText(/Title/i)).toBeDefined()
        expect(screen.getByLabelText(/Description/i)).toBeDefined()
        fireEvent.focus(screen.getByPlaceholderText(/Type to search or add category/i))
        expect(await screen.findByText(/Work/i)).toBeDefined()
        expect(await screen.findByText(/Personal/i)).toBeDefined()
    })

    it('should call onSubmit with form data', () => {
        const onSubmit = vi.fn()
        render(
            <TaskForm 
                categories={categories} 
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                onSubmit={onSubmit} 
                onCancel={vi.fn()} 
            />
        )
        
        fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Task' } })
        fireEvent.change(screen.getByLabelText(/Deadline Date/i), { target: { value: '2099-01-01' } })
        fireEvent.change(screen.getByLabelText(/Deadline Time/i), { target: { value: '11:00' } })
        fireEvent.change(screen.getByLabelText(/Est. Minutes/i), { target: { value: '30' } })
        fireEvent.click(screen.getByRole('button', { name: /Save Task/i }))
        
        expect(onSubmit).toHaveBeenCalled()
        const callData = onSubmit.mock.calls[0][0] as TaskSubmission
        expect(callData.title).toBe('New Task')
    })

    it("disables Save Task until at least one field changes", () => {
        render(
            <TaskForm
                categories={categories}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
                initialData={{
                    id: 1,
                    title: "Existing Task",
                    description: "Task description",
                    start_time: "2026-02-20T10:00:00.000Z",
                    deadline: "2026-02-20T11:00:00.000Z",
                    importance: 5,
                    completed: false,
                    categories: [],
                    estimated_minutes: 30,
                }}
            />
        )

        const saveButton = screen.getByRole("button", { name: /Save Task/i })
        expect(saveButton).toBeDisabled()

        fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Existing Task Updated" } })
        expect(saveButton).not.toBeDisabled()
    })
})
