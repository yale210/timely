from abc import abstractmethod, ABC
from datetime import datetime
from typing import Dict, Any, List

from courses.services.event import User


class CalendarProvider(ABC):
    """Abstract base class for calendar providers (Google Calendar, Outlook, etc.)."""

    @abstractmethod
    def create_event(self, user: User, event_data: Dict[str, Any]) -> str:
        """Create an event in the calendar. Returns event ID."""
        pass

    @abstractmethod
    def update_event(
        self, user: User, event_id: str, event_data: Dict[str, Any]
    ) -> bool:
        """Update an existing event. Returns True if successful."""
        pass

    @abstractmethod
    def delete_event(self, user: User, event_id: str) -> bool:
        """Delete an event. Returns True if successful."""
        pass

    @abstractmethod
    def get_events(
        self, user: User, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Retrieve events from the calendar within a date range."""
        pass