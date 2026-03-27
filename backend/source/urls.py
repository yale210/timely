"""Top-level URL routing for the Timely backend API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from core.views import (
    AssessmentViewSet,
    CategoryViewSet,
    EventViewSet,
    FriendshipViewSet,
    GradeViewSet,
    PreferenceViewSet,
    SpecialDatesViewSet,
    TaskViewSet,
    WeeklySummaryView,
)
from core.views.delete_all_events_view import DeleteAllEventsView
from core.views.delete_all_tasks_view import DeleteAllTasksView
from core.views.export_view import ExportView
from core.views.import_view import ImportView
from core.views.share_accept_view import ShareAcceptView
from core.views.share_events_view import ShareEventsView
from core.views.share_send_view import ShareSendView
from courses.views import CourseViewSet
from courses.views.teacher import TeacherView
from scheduler.views import ScheduleTasksAPIView, UnscheduleTasksAPIView

# Register the core REST resources under the shared ``/api/`` prefix.
router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"assessments", AssessmentViewSet, basename="assessment")
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"events", EventViewSet, basename="event")
router.register(r"preferences", PreferenceViewSet, basename="preference")
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"special-dates", SpecialDatesViewSet, basename="special-dates")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"teachers", TeacherView, basename="teacher")

urlpatterns = [
    path("api/admin/", include("admin_panel.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include(router.urls)),
    path("api/schedule/", ScheduleTasksAPIView.as_view(), name="schedule-tasks"),
    path("api/unschedule/", UnscheduleTasksAPIView.as_view(), name="unschedule-tasks"),
    path("api/stats/weekly/", WeeklySummaryView.as_view(), name="weekly-summary"),
    path("api/django-admin/", admin.site.urls),
    path("api/authentication/", include("authentication.urls")),
    path("api/export/", ExportView.as_view(), name="export-events"),
    path("api/import/", ImportView.as_view(), name="import-events"),
    path("api/share_send/", ShareSendView.as_view()),
    path("api/share_accept/", ShareAcceptView.as_view()),
    path("api/share_events/", ShareEventsView.as_view()),
    path("api/delete_events/", DeleteAllEventsView.as_view()),
    path("api/delete_tasks/", DeleteAllTasksView.as_view()),
    path("api/profiles/", include("profiles.urls")),
    path("api/pomo/", include("pomo.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
