"""View layer for the courses application.

This package provides DRF viewsets and mixins for handling course operations,
including enrollment, scheduling, permission management, and staff interactions.
"""

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
    """Unified ViewSet for all Course-related operations.

    Inherits from multiple mixins to provide a complete API for course
    management, including enrollment, scheduling, and permissions.
    """

    pass
