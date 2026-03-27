/**
 * Represents user preferences.
 * @interface Preference
 */
export interface Preference {
    id: number
    day_start: string
    day_end: string
    day_schedule?: { day: number; start: string; end: string }[]
    timezone: string
    max_hours_study_per_day: number
    max_days_ahead: number
    drag_snap_minutes: 5 | 10 | 15 | 20 | 30 | 60
    limit_max_hours?: boolean
    disable_sound_effects?: boolean
    default_landing_page?: "dashboard" | "calendar" | "tasks"
    week_starts_on?: "monday" | "sunday"
    time_format?: "24h" | "12h"
    days_off: number[]
}
/**
 * Represents the data structure used to update a Preference
 * @interface PreferenceUpdate
 */
export type PreferenceUpdate = Partial<Pick<
    Preference, "day_start"|"day_end"|"day_schedule"|"timezone"|"max_hours_study_per_day"|"max_days_ahead"|"drag_snap_minutes"|"limit_max_hours"|"disable_sound_effects"|"default_landing_page"|"week_starts_on"|"time_format"|"days_off"
>>
