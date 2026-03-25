from rest_framework.routers import DefaultRouter

import courses.views.course
import courses.views.teacher

router = DefaultRouter()
router.register(r"teachers/", courses.views.teacher.TeacherView, basename="teacher")
router.register(r"/", courses.views.CourseViewSet, basename="course")
urlpatterns = [
    router.urls,
]
