/**
 * Represents user preferences.
 * @interface Preference
 */
export interface Preference {
    id: number
    day_start: string
    day_end: string
    day_schedule?: { day: number; start: string; end: string }[]
    max_hours_study_per_day: number
    limit_max_hours?: boolean
    disable_sound_effects?: boolean
    days_off: number[]
}
/**
 * Represents the data structure used to update a Preference
 * @interface PreferenceUpdate
 */
export type PreferenceUpdate = Partial<Pick<
    Preference, "day_start"|"day_end"|"day_schedule"|"max_hours_study_per_day"|"limit_max_hours"|"disable_sound_effects"|"days_off"
>>