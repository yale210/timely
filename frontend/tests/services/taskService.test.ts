import { it, describe, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { type Task, type TaskSubmission, type Category } from '@/types'

vi.mock('axios', () => {
    const mockAxios = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
        defaults: {},
    } satisfies {
        get: ReturnType<typeof vi.fn>
        post: ReturnType<typeof vi.fn>
        patch: ReturnType<typeof vi.fn>
        delete: ReturnType<typeof vi.fn>
        create: ReturnType<typeof vi.fn>
        interceptors: {
            request: { use: ReturnType<typeof vi.fn> }
            response: { use: ReturnType<typeof vi.fn> }
        }
        defaults: Record<string, unknown>
    }
    mockAxios.create.mockReturnValue(mockAxios)
    return { default: mockAxios }
})

import * as taskService from '@/services/taskService'
import api from '@/services/api'
import { authService } from '@/services/authService'

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

    it('deleteEvents should call api.delete', async () => {
        const message = "Delete Events"
        const spy = vi.spyOn(api, 'delete').mockResolvedValue({ data: { message: message }, } as { data: { message: string } })
        const result = await taskService.deleteEvents();
        expect(spy).toHaveBeenCalledWith('/api/delete_events/')
        expect(result).toBe(message)
    })

    it('deleteTasks should call api.delete', async () => {
        const message = "Delete Tasks"
        const spy = vi.spyOn(api, 'delete').mockResolvedValue({ data: { message: message }, } as { data: { message: string } })
        const result = await taskService.deleteTasks();
        expect(spy).toHaveBeenCalledWith('/api/delete_tasks/')
        expect(result).toBe(message)
    })

    it('deleteAccount should call api.delete', async () => {
        const message = "Delete Account"
        const spy = vi.spyOn(api, 'delete').mockResolvedValue({ data: { message: message }, } as { data: { message: string } })
        const result = await authService.deleteAccount();
        expect(spy).toHaveBeenCalledWith('/api/delete_account/')
        expect(result).toBe(message)
    })


})

