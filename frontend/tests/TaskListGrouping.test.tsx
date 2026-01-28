import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import TaskList from "../src/pages/TaskList"
import * as taskService from "../src/services/taskService"
import { MemoryRouter } from 'react-router-dom'
import moment from 'moment'

vi.mock("../src/services/taskService")

// Mock ResizeObserver for Headless UI
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

const tomorrow = moment().add(1, 'day').toISOString();
const inTwoDays = moment().add(2, 'day').toISOString();

const mockTasks = [
    {
        id: 1,
        title: 'Task Tomorrow',
        deadline: tomorrow,
        importance: 5,
        estimated_minutes: 30,
        completed: false,
        categories: [],
        description: 'Description tomorrow'
    },
    {
        id: 2,
        title: 'Task in Two Days',
        deadline: inTwoDays,
        importance: 5,
        estimated_minutes: 30,
        completed: false,
        categories: [],
        description: 'Description in two days'
    }
]

describe('TaskList Grouping', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should group upcoming tasks by day', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        // Check for "Upcoming" header
        await waitFor(() => expect(screen.getByText('Upcoming')).toBeDefined())

        // Check for "Tomorrow" label
        expect(screen.getByText('Tomorrow')).toBeDefined()

        // Check for absolute date label for the task in two days
        const twoDaysDate = moment().add(2, 'day').format('ddd D MMM')
        expect(screen.getByText(twoDaysDate)).toBeDefined()

        // Check tasks are under their respective groups
        expect(screen.getByText('Task Tomorrow')).toBeDefined()
        expect(screen.getByText('Task in Two Days')).toBeDefined()
    })
})
