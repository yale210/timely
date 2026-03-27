"""View layer for the courses application.

This package provides DRF viewsets and mixins for handling course operations,
including enrollment, scheduling, permission management, and staff interactions.
"""

from courses.views.base import CourseViewSetBase
from courses.views.courses import CourseCrudMixin
from courses.views.events import CourseEventsMixin
from courses.views.membership import CourseMembershipMixin
from courses.views.permissions import CoursePermissionsMixin
from courses.views.staff import CourseStaffMixin
from courses.views.student import CourseStudentMixin


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
