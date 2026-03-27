"""Django REST Framework views for the core application."""

from .analytics_view import WeeklySummaryView as WeeklySummaryView
from .assessment_view import AssessmentViewSet as AssessmentViewSet
from .calendar_view import TaskViewSet as TaskViewSet
from .category_view import CategoryViewSet as CategoryViewSet
from .event_view import EventViewSet as EventViewSet
from .friendship_view import FriendshipViewSet as FriendshipViewSet
from .grade_view import GradeViewSet as GradeViewSet
from .preference_view import PreferenceViewSet as PreferenceViewSet
from .special_dates_view import SpecialDatesViewSet as SpecialDatesViewSet

__all__ = [
    "AssessmentViewSet",
    "CategoryViewSet",
    "EventViewSet",
    "FriendshipViewSet",
    "GradeViewSet",
    "PreferenceViewSet",
    "SpecialDatesViewSet",
    "TaskViewSet",
    "WeeklySummaryView",
]
