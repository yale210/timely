import { describe, expect, it } from "vitest"
import { FEATURES, MOCKUPS } from "@/components/about/aboutFeatures"

describe("aboutFeatures", () => {
  it("defines the expected feature data", () => {
    expect(FEATURES).toHaveLength(5)
    expect(FEATURES.map((feature) => feature.id)).toEqual([
      "tasks",
      "calendar",
      "gradebook",
      "xp",
      "social",
    ])

    for (const feature of FEATURES) {
      expect(feature.subtitle).not.toHaveLength(0)
      expect(feature.title).not.toHaveLength(0)
      expect(feature.description).not.toHaveLength(0)
      expect(feature.highlights.length).toBeGreaterThan(0)
      expect(feature.accent).toMatch(/^bg-/)
    }
  })

  it("maps every feature id to a mockup component", () => {
    for (const feature of FEATURES) {
      expect(MOCKUPS[feature.id]).toBeTypeOf("function")
    }

    expect(Object.keys(MOCKUPS).sort()).toEqual(FEATURES.map((feature) => feature.id).sort())
  })
})
