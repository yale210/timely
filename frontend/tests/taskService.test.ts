import { it, describe, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import * as taskService from '../src/services/taskService'
import { type Task, type TaskSubmission } from '../src/types'

vi.mock('axios')

describe('taskService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('getTasks should call axios.get', async () => {
        const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] } as { data: Task[] })
        await taskService.getTasks()
        expect(spy).toHaveBeenCalledWith('/api/tasks/', { params: undefined })
    })

    it('createTask should call axios.post', async () => {
        const data: TaskSubmission = { title: 'New Task' };
        const mockResponse: Task = {
            id: 1,
            title: 'New Task',
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 30,
            completed: false,
            categories: []
        };
        const spy = vi.spyOn(axios, 'post').mockResolvedValue({ data: mockResponse } as unknown as { data: Task })
        await taskService.createTask(data)
        expect(spy).toHaveBeenCalledWith('/api/tasks/', data)
    })
})