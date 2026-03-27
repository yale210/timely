"""URL routing for the courses app."""

from rest_framework.routers import DefaultRouter

import courses.views.courses_view
import courses.views.teacher_view

router = DefaultRouter()
router.register(r"teachers/", courses.views.teacher_view.TeacherView, basename="teacher")
router.register(r"/", courses.views.CourseViewSet, basename="course")
urlpatterns = [
    router.urls,
]

