import { it, describe, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskForm } from "../src/components/index"

describe('TaskForm', () => {
    afterEach(cleanup)
    
    const categories = [
        { id: 1, text: 'Work' },
        { id: 2, text: 'Personal' }
    ]

    it('should render form fields', () => {
        render(
            <TaskForm 
                categories={categories} 
                onSubmit={vi.fn()} 
                onCancel={vi.fn()} 
            />
        )
        
        expect(screen.getByLabelText(/Title/i)).toBeDefined()
        expect(screen.getByLabelText(/Description/i)).toBeDefined()
        expect(screen.getByText(/Work/i)).toBeDefined()
        expect(screen.getByText(/Personal/i)).toBeDefined()
    })

    it('should call onSubmit with form data', () => {
        const onSubmit = vi.fn()
        render(
            <TaskForm 
                categories={categories} 
                onSubmit={onSubmit} 
                onCancel={vi.fn()} 
            />
        )
        
        fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Task' } })
        fireEvent.click(screen.getByRole('button', { name: /Save Task/i }))
        
        expect(onSubmit).toHaveBeenCalled()
        const callData = onSubmit.mock.calls[0][0]
        expect(callData.title).toBe('New Task')
    })
})