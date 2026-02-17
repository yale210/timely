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
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    TaskViewSet,
    EventViewSet,
    PreferenceViewSet,
    GradeViewSet,
    CategoryViewSet,
    WeeklySummaryView,
)


router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"events", EventViewSet, basename="event")
router.register(r"pkreferences", PreferenceViewSet, basename="preference")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/stats/weekly/", WeeklySummaryView.as_view(), name="weekly-summary"),
    path("api/admin/", admin.site.urls),
    path("api/authentication/", include("authentication.urls")),
    path("api/profiles/", include("profiles.urls")),
]
