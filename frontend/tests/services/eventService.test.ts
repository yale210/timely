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
    expect(spy).toHaveBeenCalledWith("/api/events/", { params: undefined })
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
    expect(spy).toHaveBeenCalledWith("/api/events/1/", data, { params: undefined })
    expect(result).toEqual(updatedEvent)
  })

  it("deleteEvent should call axios.delete", async () => {
    const spy = vi.spyOn(axios, "delete").mockResolvedValue({})
    await eventService.deleteEvent(1)
    expect(spy).toHaveBeenCalledWith("/api/events/1/", { params: undefined })
  })

  it("getServerTime should call axios.get and return server time", async () => {
    const payload = { server_time: new Date().toISOString() }
    const spy = vi.spyOn(axios, "get").mockResolvedValue({ data: payload })
    const result = await eventService.getServerTime()
    expect(spy).toHaveBeenCalledWith("/api/events/server_time/")
    expect(result).toEqual(payload)
  })

  it("passes query params for range and mutation scope", async () => {
    const listSpy = vi.spyOn(axios, "get").mockResolvedValue({ data: [mockEvent] })
    const patchSpy = vi.spyOn(axios, "patch").mockResolvedValue({ data: mockEvent })
    const deleteSpy = vi.spyOn(axios, "delete").mockResolvedValue({})

    await eventService.getEvents({ start_date: "2026-02-01", end_date: "2026-02-28" })
    await eventService.updateEvent(
      1,
      { title: "Scoped update" },
      { scope: "this", original_start_time: "2026-02-20T10:00:00Z" },
    )
    await eventService.deleteEvent(1, { scope: "all" })

    expect(listSpy).toHaveBeenCalledWith("/api/events/", {
      params: { start_date: "2026-02-01", end_date: "2026-02-28" },
    })
    expect(patchSpy).toHaveBeenCalledWith(
      "/api/events/1/",
      { title: "Scoped update" },
      { params: { scope: "this", original_start_time: "2026-02-20T10:00:00Z" } },
    )
    expect(deleteSpy).toHaveBeenCalledWith("/api/events/1/", {
      params: { scope: "all" },
    })
  })

  it("revertEventInstance should call axios.post with original_start_time", async () => {
    const spy = vi.spyOn(axios, "post").mockResolvedValue({})

    await eventService.revertEventInstance(1, "2026-02-20T10:00:00Z")

    expect(spy).toHaveBeenCalledWith(
      "/api/events/1/revert-instance/",
      null,
      { params: { original_start_time: "2026-02-20T10:00:00Z" } },
    )
  })
})
