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
        interceptors: { request: { use: vi.fn() } },
        defaults: {},
    }
    mockAxios.create.mockReturnValue(mockAxios)
    return { default: mockAxios }
})

import * as taskService from '@/services/taskService'

describe('taskService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        // Provide axios.create + interceptors so api.ts doesn't crash when axios is mocked
        const mockAxios = axios as unknown as {
            create?: () => typeof axios
            interceptors?: { request?: { use?: (fn: (c: any) => any) => any } }
        }
        mockAxios.create = vi.fn(() => mockAxios as unknown as typeof axios)
        mockAxios.interceptors = mockAxios.interceptors ?? {}
        mockAxios.interceptors.request = mockAxios.interceptors.request ?? {}
        mockAxios.interceptors.request.use = mockAxios.interceptors.request.use ?? vi.fn((fn) => fn)
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
