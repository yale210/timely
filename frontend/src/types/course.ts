/**
 * Represents a course that can be joined
 * Represents a course that can be joined
 */
export interface Course {
  id: number;
  name: string;
  description: string;
  lead: string | null;
  created_at: string;
  active?: boolean;
}

/**
 * Data required to create a course
 */
export interface CourseCreation {
  name: string;
  description: string;
  lead?: number | null;
  active?: boolean;
}

/**
 * Represents a partial update to a course
 */
export interface CourseUpdate {
  id?: number;
  name?: string;
  description?: string;
  lead?: number | null;
  active?: boolean;
}

/**
 * Represents a course event
 */
export interface CourseEvent {
  id: number;
  course: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Data required to create a course event
 */
export interface CourseEventCreation {
  course: number;
  created_by?: number | null;
}

export interface CourseStudent {
  id: number;
  user_id: number;
  username: string;
  email: string;
  enrolled_at: string;
}

export interface CourseStaff {
  id: number;
  user_id: number;
  username: string;
  active: boolean;
  assigned_at: string;
}
