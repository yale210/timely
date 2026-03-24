"""
URL configuration for source project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from core.views import (
    EventViewSet,
    GradeViewSet,
    CategoryViewSet,
    PreferenceViewSet,
    TaskViewSet,
    WeeklySummaryView,
    FriendshipViewSet,
    SpecialDatesViewSet,
)
from core.views.export_view import ExportView
from core.views.import_view import ImportView

from scheduler.views import ScheduleTasksAPIView, UnscheduleTasksAPIView


router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"events", EventViewSet, basename="event")
router.register(r"preferences", PreferenceViewSet, basename="preference")
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"special-dates", SpecialDatesViewSet, basename="special-dates")


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
    path("api/profiles/", include("profiles.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
