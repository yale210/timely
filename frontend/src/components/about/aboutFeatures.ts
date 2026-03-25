import type { ComponentType } from "react"
import TasksMockup from "./TasksMock"
import CalendarMockup from "./CalendarMock"
import GradebookMockup from "./GradebookMock"
import XPMockup from "./XPMock"
import SocialMockup from "./SocialMock"

/**
 *
 */
export interface Feature {
  id: string
  subtitle: string
  title: string
  description: string
  highlights: string[]
  accent: string
}

export const FEATURES: Feature[] = [
  {
    id: "tasks",
    subtitle: "Task Management",
    title: "Stay on top of everything you need to do",
    description:
      "Capture tasks with rich detail — set deadlines, estimate time, assign importance levels, and organise by category. With smart sorting and filtering, nothing slips through the cracks.",
    highlights: ["Deadline & time tracking", "Importance levels", "Category tags", "Smart filters"],
    accent: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "calendar",
    subtitle: "Calendar",
    title: "Visualise your entire schedule at a glance",
    description:
      "See your tasks and events side by side in a clean, responsive calendar. Switch between day, week, and month views so you always know what is coming up next.",
    highlights: ["Day, week & month views", "Task and event display", "Event scheduling", "Agenda overview"],
    accent: "bg-violet-100 text-violet-700",
  },
  {
    id: "gradebook",
    subtitle: "Gradebook",
    title: "Track your academic progress honestly",
    description:
      "Log grades across all your modules and see your performance at a glance. The gradebook gives you one clean view of your academic record so you know exactly where to focus.",
    highlights: ["Module-level tracking", "Grade logging", "Performance overview", "Category filters"],
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "xp",
    subtitle: "XP & Progression",
    title: "Turn productivity into a game you can win",
    description:
      "Every completed task earns you experience points. Level up, build streaks, and watch your progression grow. Timely makes the act of staying productive genuinely rewarding.",
    highlights: ["XP on task completion", "Level system", "Daily streaks", "Progress tracking"],
    accent: "bg-amber-100 text-amber-700",
  },
  {
    id: "social",
    subtitle: "Friends & Leaderboard",
    title: "Study better alongside your friends",
    description:
      "Connect with classmates, compare productivity stats, and keep each other accountable. A friendly leaderboard turns everyday studying into a shared, motivating experience.",
    highlights: ["Friend connections", "Comparative rankings", "Global leaderboard", "Social motivation"],
    accent: "bg-rose-100 text-rose-700",
  },
]

// Component references — FeatureSection renders whichever one matches feature.id
export const MOCKUPS: Record<string, ComponentType> = {
  tasks: TasksMockup,
  calendar: CalendarMockup,
  gradebook: GradebookMockup,
  xp: XPMockup,
  social: SocialMockup,
}
