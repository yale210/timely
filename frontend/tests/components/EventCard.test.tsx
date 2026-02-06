import { it, describe, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import EventCard from "@/components/EventCard"
import moment from "moment"

describe("EventCard", () => {
  afterEach(cleanup)

  const mockEvent = {
    id: 1,
    title: "Test Event",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    importance: 8,
    categories: [{ id: 1, text: "Meeting" }],
    reminders: []
  }

  it("should render event title and category", () => {
    render(<EventCard event={mockEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/Test Event/i)).toBeDefined()
    expect(screen.getByText(/Meeting/i)).toBeDefined()
  })

  it("should render importance pill with correct label", () => {
    render(<EventCard event={mockEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/High/i)).toBeDefined()
  })

  it("should call onClick when card is clicked", () => {
    const onClick = vi.fn()
    render(<EventCard event={mockEvent} onClick={onClick} />)
    const card = screen.getByText(/Test Event/i).closest("div")
    if (!card) throw new Error("Card not found")
    fireEvent.click(card)
    expect(onClick).toHaveBeenCalledWith(mockEvent)
  })

  it("should show numeric importance on hover", () => {
    render(<EventCard event={mockEvent} onClick={vi.fn()} />)
    const card = screen.getByText(/Test Event/i).closest("div.group")
    if (!card) throw new Error("Card not found")
    
    expect(screen.queryByText("8")).toBeNull()
    
    fireEvent.mouseEnter(card)
    expect(screen.getByText("8")).toBeDefined()
    expect(screen.queryByText(/High/i)).toBeNull()
    
    fireEvent.mouseLeave(card)
    expect(screen.getByText(/High/i)).toBeDefined()
    expect(screen.queryByText("8")).toBeNull()
  })

  it("should display Very Low importance for level 1", () => {
    const lowImportanceEvent = { ...mockEvent, importance: 1 }
    render(<EventCard event={lowImportanceEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/Very low/i)).toBeDefined()
  })

  it("should display Critical importance for level 10", () => {
    const criticalEvent = { ...mockEvent, importance: 10 }
    render(<EventCard event={criticalEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/Critical/i)).toBeDefined()
  })

  it("should display Medium importance for level 5", () => {
    const mediumEvent = { ...mockEvent, importance: 5 }
    render(<EventCard event={mediumEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/^Medium$/i)).toBeDefined()
  })

  it("should display recurrence interval if present", () => {
    const recurringEvent = { ...mockEvent, recurrence_interval: "weekly" as const }
    render(<EventCard event={recurringEvent} onClick={vi.fn()} />)
    expect(screen.getByText(/weekly/i)).toBeDefined()
  })

  it("should display location if present", () => {
    const eventWithLocation = { ...mockEvent, location: "Conference Room A" }
    render(<EventCard event={eventWithLocation} onClick={vi.fn()} />)
    expect(screen.getByText(/Conference Room A/i)).toBeDefined()
  })

  it("should display description on hover", () => {
    const eventWithDescription = { ...mockEvent, description: "Important discussion about project deadlines" }
    render(<EventCard event={eventWithDescription} onClick={vi.fn()} />)
    
    const card = screen.getByText(/Test Event/i).closest("div.group")
    if (!card) throw new Error("Card not found")
    
    expect(screen.queryByText(/Important discussion/i)).toBeNull()
    
    fireEvent.mouseEnter(card)
    expect(screen.getByText(/Important discussion/i)).toBeDefined()
  })

  it("should display Low importance for level 2", () => {
    const event = { ...mockEvent, importance: 2 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/^Low$/i)).toBeDefined()
  })

  it("should display Low-medium importance for level 3", () => {
    const event = { ...mockEvent, importance: 3 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/Low-medium/i)).toBeDefined()
  })

  it("should display Medium-low importance for level 4", () => {
    const event = { ...mockEvent, importance: 4 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/Medium-low/i)).toBeDefined()
  })

  it("should display Medium-high importance for level 6", () => {
    const event = { ...mockEvent, importance: 6 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/Medium-high/i)).toBeDefined()
  })

  it("should display High-medium importance for level 7", () => {
    const event = { ...mockEvent, importance: 7 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/High-medium/i)).toBeDefined()
  })

  it("should display Very high importance for level 9", () => {
    const event = { ...mockEvent, importance: 9 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/Very high/i)).toBeDefined()
  })

  it("should display default Medium importance for invalid value", () => {
    const event = { ...mockEvent, importance: 99 }
    render(<EventCard event={event} onClick={vi.fn()} />)
    expect(screen.getByText(/^Medium$/i)).toBeDefined()
  })

  it("should toggle Show More/Less for long description", () => {
    const longDescription = "This is a very long description that exceeds 60 characters and should show the expand/collapse button for better user experience."
    const eventWithLongDesc = { ...mockEvent, description: longDescription }
    render(<EventCard event={eventWithLongDesc} onClick={vi.fn()} />)
    
    const card = screen.getByText(/Test Event/i).closest("div.group")
    if (!card) throw new Error("Card not found")
    
    fireEvent.mouseEnter(card)
    expect(screen.getByText(/Show More/i)).toBeDefined()
    
    fireEvent.click(screen.getByText(/Show More/i))
    expect(screen.getByText(/Show Less/i)).toBeDefined()
    
    fireEvent.click(screen.getByText(/Show Less/i))
    expect(screen.getByText(/Show More/i)).toBeDefined()
  })

  it("should handle focus and blur events", () => {
    render(<EventCard event={mockEvent} onClick={vi.fn()} />)
    const card = screen.getByText(/Test Event/i).closest("div.group")
    if (!card) throw new Error("Card not found")
    
    fireEvent.focus(card)
    expect(screen.getByText("8")).toBeDefined()
    
    fireEvent.blur(card)
    expect(screen.getByText(/High/i)).toBeDefined()
  })

  it("should dim past events", () => {
    const pastEvent = { 
      ...mockEvent, 
      start_time: moment().subtract(2, 'days').toISOString(),
      end_time: moment().subtract(2, 'days').add(1, 'hour').toISOString()
    }
    render(<EventCard event={pastEvent} onClick={vi.fn()} />)
    const card = screen.getByText(/Test Event/i).closest("div.group")
    expect(card?.className).toContain("opacity-75")
  })

  it("should render without categories", () => {
    const eventNoCategories = { ...mockEvent, categories: [] }
    render(<EventCard event={eventNoCategories} onClick={vi.fn()} />)
    expect(screen.getByText(/Test Event/i)).toBeDefined()
  })
})
