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
    pass
