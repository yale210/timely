"""Views for exporting user event data."""

from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.views import APIView

from core.models import Event


class ExportView(APIView):
    """Export the authenticated user's events in a .txt file in iCalendar format."""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _base_calendar_lines() -> list[str]:
        """Build the standard iCalendar header."""
        return [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:TIMELY v1.0",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
        ]

    @staticmethod
    def _get_rrule_until(event: Event) -> str:
        """Resolve the iCalendar recurrence end value."""
        if event.recurrence_end is None:
            return "20460101T200000"
        return event.recurrence_end.strftime("%Y%m%dT%H%M%S")

    def _build_event_lines(self, event: Event) -> list[str]:
        """Serialize a single event into iCalendar lines."""
        lines = [
            "BEGIN:VEVENT",
            f"UID:e{event.id}",
            f"DTSTAMP:{event.last_edited.strftime('%Y%m%dT%H%M%S')}Z",
            f"DTSTART;TZID=Europe/London:{event.start_time.strftime('%Y%m%dT%H%M%S')}",
            f"DTEND;TZID=Europe/London:{event.end_time.strftime('%Y%m%dT%H%M%S')}",
            f"SUMMARY:{event.title}",
            f"DESCRIPTION:{event.description}",
            f"LOCATION:{event.location}",
        ]

        if event.recurrence_interval is not None:
            lines.append(
                f"RRULE:FREQ={event.recurrence_interval.upper()};UNTIL={self._get_rrule_until(event)}Z"
            )

        lines.append("END:VEVENT")
        return lines

    def get(self, request):
        """Generate and return an iCalendar format text file for the user's events.

        Args:
            request (Request): The DRF request object.

        Returns:
            HttpResponse: A plain text file attachment in iCalendar format.

        """
        events = Event.objects.filter(user=request.user)
        lines = self._base_calendar_lines()

        for event in events:
            lines.extend(self._build_event_lines(event))

        lines.append("END:VCALENDAR")
        content = "\n".join(lines)
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response
