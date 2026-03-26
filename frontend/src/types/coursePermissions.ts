import type {CoursePermissions} from "@/types/course.ts";


/**
 * Represents the permission settings for a course, encapsulating various access
 * and privilege configurations. This class provides a structure for managing
 * and organizing permissions related to courses.
 * Each permission in the `CoursePermissions` object is initialized to `false`,
 * ensuring no privileges are granted by default. Permissions can be modified
 * after initialization as per the requirements of the application.
 */
export class CoursePeED {
     options: CoursePermissions;

    /**
     * Initializes a new instance of the class with default course permission options.
     * The permissions are set to `false` by default, indicating no access or privileges.
     * @returns Does not return a value.
     */
    constructor() {
        this.options = {} as CoursePermissions;
        this.options.can_view_course_details = false;
        this.options.can_view_events = false;
        this.options.can_create_join_code = false;
        this.options.can_change_name = false;
        this.options.can_change_description = false;
        this.options.can_update_course = false;
        this.options.can_destroy_course = false;
        this.options.can_manage_staff = false;
        this.options.can_join = false;
        this.options.can_leave = false;
    }
}