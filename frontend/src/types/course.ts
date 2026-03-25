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
  students: CourseStudent[];
  
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

/**
 * Represents a student enrolled in a course.
 *
 * This interface includes information about the student's identification,
 * user account details, and enrollment timestamp.
 *
 * Properties:
 * - `id`: A unique identifier for the course student.
 * - `user_id`: A unique identifier linking the student to their user account.
 * - `username`: The username of the student.
 * - `email`: The email address of the student.
 * - `enrolled_at`: The timestamp indicating when the student was enrolled in the course.
 */
export interface CourseStudent {
  id: number,
  username: string,
}

/**
 * Represents a staff member assigned to a course.
 *
 * This interface is used to store information about course staff members,
 * including their identification details, username, activity status,
 * and the date of their assignment.
 *
 * Properties:
 * - `id`: A unique identifier for the course staff member.
 * - `user_id`: The user ID associated with the staff member.
 * - `username`: The username of the course staff member.
 * - `active`: A boolean indicating whether the staff member is currently active.
 * - `assigned_at`: A timestamp representing when the staff member was assigned to the course.
 */
export interface CourseStaff {
  id: number;
  user_id: number;
  username: string;
  active: boolean;
  assigned_at: string;
}

/**
 * Represents the set of permissions associated with a course, providing
 * control over various actions that can be performed within the course.
 */
export interface CoursePermissions {
  can_view_course_details: boolean;
  can_view_events: boolean;
  can_create_join_code: boolean;
  can_change_name: boolean;
  can_change_description: boolean;
  can_update_course: boolean;
  can_destroy_course: boolean;
  can_manage_staff: boolean;
  can_join: boolean;
  can_leave: boolean;
}

/**
 * Represents a cached entry of permissions with an expiration timestamp.
 *
 * This interface is designed to store permissions for a specific course
 * along with a timestamp indicating when the cached entry is considered expired.
 * It can be used to optimize permission checks by caching them and preventing
 * frequent re-calculations or database calls within a short period of time.
 *
 * Properties:
 * - `value`: The permissions associated with a course.
 * - `expiresAt`: The timestamp (in milliseconds since the UNIX epoch) indicating
 *   when this cached entry is no longer valid.
 */
export interface CachedPermissionsEntry {
  value: CoursePermissions;
  expiresAt: number;
}