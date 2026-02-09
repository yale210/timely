import { it, describe, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import * as taskService from '@/services/taskService'
import { type Task, type TaskSubmission, type Category } from '@/types'

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

    it('updateTask should call axios.patch', async () => {
        const data: TaskSubmission = { title: 'Updated Task' };
        const mockResponse: Task = {
            id: 1,
            title: 'Updated Task',
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 30,
            completed: false,
            categories: []
        };
        const spy = vi.spyOn(axios, 'patch').mockResolvedValue({ data: mockResponse } as unknown as { data: Task })
        await taskService.updateTask(1, data)
        expect(spy).toHaveBeenCalledWith('/api/tasks/1/', data)
    })

    it('deleteTask should call axios.delete', async () => {
        const spy = vi.spyOn(axios, 'delete').mockResolvedValue({})
        await taskService.deleteTask(1)
        expect(spy).toHaveBeenCalledWith('/api/tasks/1/')
    })

    it('getCategories should call axios.get', async () => {
        const mockCategories: Category[] = [{ id: 1, text: 'Work' }]
        const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: mockCategories })
        const result = await taskService.getCategories()
        expect(spy).toHaveBeenCalledWith('/api/categories/')
        expect(result).toEqual(mockCategories)
    })
})