"""URL configuration for the courses application.

Defines the API endpoints for course management and teacher administration
using Django REST Framework routers.
"""

from rest_framework.routers import DefaultRouter

import courses.views.courses
import courses.views.teacher

router = DefaultRouter()
router.register(r"teachers/", courses.views.teacher.TeacherView, basename="teacher")
router.register(r"/", courses.views.CourseViewSet, basename="course")
urlpatterns = [
    router.urls,
]
