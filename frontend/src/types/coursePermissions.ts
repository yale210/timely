import type {CoursePermissions} from "@/types/course.ts";

/**
 *
 */
export class CoursePeED {
     options: CoursePermissions;

    /**
     *
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