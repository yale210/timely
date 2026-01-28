import { it, describe, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import * as taskService from '../src/services/taskService'

vi.mock('axios')

describe('taskService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('getTasks should call axios.get', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] })
        await taskService.getTasks()
        expect(axios.get).toHaveBeenCalledWith('/api/tasks/', { params: undefined })
    })

    it('createTask should call axios.post', async () => {
        const data = { title: 'New Task' };
        vi.mocked(axios.post).mockResolvedValue({ data })
        await taskService.createTask(data as Partial<Task>)
        expect(axios.post).toHaveBeenCalledWith('/api/tasks/', data)
    })
})