from rest_framework.routers import DefaultRouter

import courses.views.courses

router = DefaultRouter()
router.register(r"/", courses.views.courses.CourseView, basename="course")
urlpatterns = [
    router.urls,
]
