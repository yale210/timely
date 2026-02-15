import { it, describe, expect, vi, beforeEach } from "vitest"
import axios from "axios"
import { type Event, type EventSubmission } from "@/types"

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
    defaults: {},
  } satisfies {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    patch: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    interceptors: { request: { use: ReturnType<typeof vi.fn> } }
    defaults: Record<string, unknown>
  }
  mockAxios.create.mockReturnValue(mockAxios)
  return { default: mockAxios }
})

import * as eventService from "@/services/eventService"

describe("eventService", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const mockEvent: Event = {
    id: 1,
    title: "Test Event",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    categories: [],
    reminders: []
  }

  it("getEvents should call axios.get and return events", async () => {
    const mockEvents = [mockEvent]
    const spy = vi.spyOn(axios, "get").mockResolvedValue({ data: mockEvents })
    const result = await eventService.getEvents()
    expect(spy).toHaveBeenCalledWith("/api/events/")
    expect(result).toEqual(mockEvents)
  })

  it("createEvent should call axios.post and return created event", async () => {
    const data: EventSubmission = {
      title: "New Event",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString()
    }
    const spy = vi.spyOn(axios, "post").mockResolvedValue({ data: mockEvent })
    const result = await eventService.createEvent(data)
    expect(spy).toHaveBeenCalledWith("/api/events/", data)
    expect(result).toEqual(mockEvent)
  })

  it("updateEvent should call axios.patch and return updated event", async () => {
    const data: EventSubmission = { title: "Updated Event" }
    const updatedEvent = { ...mockEvent, title: "Updated Event" }
    const spy = vi.spyOn(axios, "patch").mockResolvedValue({ data: updatedEvent })
    const result = await eventService.updateEvent(1, data)
    expect(spy).toHaveBeenCalledWith("/api/events/1/", data)
    expect(result).toEqual(updatedEvent)
  })

  it("deleteEvent should call axios.delete", async () => {
    const spy = vi.spyOn(axios, "delete").mockResolvedValue({})
    await eventService.deleteEvent(1)
    expect(spy).toHaveBeenCalledWith("/api/events/1/")
  })
})
