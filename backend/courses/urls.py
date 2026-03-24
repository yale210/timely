from rest_framework.routers import DefaultRouter

import courses.views.courses
import courses.views.teacher

router = DefaultRouter()
router.register(r"teachers/", courses.views.teacher.TeacherView, basename="teacher")
router.register(r"/", courses.views.courses.CourseView, basename="course")
urlpatterns = [
    router.urls,
]
