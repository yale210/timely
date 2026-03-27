"""Public course views and view sets."""

from courses.views.base_view import CourseViewSetBase
from courses.views.courses_view import CourseCrudMixin
from courses.views.events_view import CourseEventsMixin
from courses.views.membership_view import CourseMembershipMixin
from courses.views.permissions_view import CoursePermissionsMixin
from courses.views.staff_view import CourseStaffMixin
from courses.views.student_view import CourseStudentMixin


class CourseViewSet(
    CourseStudentMixin,
    CoursePermissionsMixin,
    CourseStaffMixin,
    CourseMembershipMixin,
    CourseEventsMixin,
    CourseCrudMixin,
    CourseViewSetBase,
):
    """View set for course resources and related actions."""
    pass

