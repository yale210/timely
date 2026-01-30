import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import TaskList from "@/pages/TaskList"
import * as taskService from "@/services/taskService"
import { MemoryRouter } from 'react-router-dom'

vi.mock("@/services/taskService")

// Mock ResizeObserver for Headless UI
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

const mockTasks = [
    {
        id: 1,
        title: 'High Importance Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 9,
        estimated_minutes: 60,
        completed: false,
        categories: []
    },
    {
        id: 2,
        title: 'Quick Win Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 3,
        estimated_minutes: 20,
        completed: false,
        categories: []
    },
    {
        id: 3,
        title: 'Normal Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 5,
        estimated_minutes: 45,
        completed: false,
        categories: []
    }
]

describe('TaskList Filtering', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should filter by High Importance', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Open filter menu - use the one in the header
        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        // Click High Importance Only
        fireEvent.click(screen.getByText(/High Importance Only/i))

        await waitFor(() => expect(screen.queryByText('Quick Win Task')).toBeNull())
        expect(screen.getByText('High Importance Task')).toBeDefined()
        expect(screen.queryByText('Normal Task')).toBeNull()
    })

    it('should filter by Quick Wins', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Quick Win Task')).toBeDefined())

        // Open filter menu
        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        // Click Quick Wins
        fireEvent.click(screen.getByText(/≤ 30 mins \(Quick wins\)/i))

        await waitFor(() => expect(screen.queryByText('High Importance Task')).toBeNull())
        expect(screen.getByText('Quick Win Task')).toBeDefined()
        expect(screen.queryByText('Normal Task')).toBeNull()
    })
})
