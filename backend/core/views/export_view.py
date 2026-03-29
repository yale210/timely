"""Views for exporting user event data."""

from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.views import APIView

from core.models import Event


class ExportView(APIView):
    """Export the authenticated user's events in a .txt file in iCalendar format."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Generate and return an iCalendar format text file for the user's events.

        Args:
            request (Request): The DRF request object.

        Returns:
            HttpResponse: A plain text file attachment in iCalendar format.

        """
        # All of the events that belong to the user
        events = Event.objects.filter(user=request.user)

        lines = self.append_calendar_meta_data()

        # Each Event will be appened one-by-one
        for event in events:
            lines = self.append_event_data(lines, event)

        # End of file standard format
        lines.append("END:VCALENDAR")

        # Join the lines
        content = "\n".join(lines)

        # Text File, this is what the user will download
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response

    def append_calendar_meta_data(self):
        """Initialise the calendar metadata for the export file.

        Returns:
            list[str]: A list of strings containing the iCalendar header lines.

        """
        # Every file requires this metadata at the top, this is not any event
        lines = []
        lines.append("BEGIN:VCALENDAR")
        lines.append("VERSION:2.0")
        lines.append("PRODID:TIMELY v1.0")
        lines.append("CALSCALE:GREGORIAN")
        lines.append("METHOD:PUBLISH")
        return lines

    def append_event_data(self, lines, event):
        """Serialise an event's data into iCalendar format and append to lines.

        Args:
            lines (list[str]): The current list of iCalendar lines.
            event (Event): The event object to serialise.

        Returns:
            list[str]: The updated list of iCalendar lines including the new event.

        """
        lines.append("BEGIN:VEVENT")
        # Event ID, this is just e + the event id in the DB e.g. e123
        lines.append(f"UID:e{event.id}")
        lines.append(f"DTSTAMP:{event.last_edited.strftime('%Y%m%dT%H%M%S')}Z")
        lines.append(
            f"DTSTART;TZID=Europe/London:{event.start_time.strftime('%Y%m%dT%H%M%S')}"
        )
        lines.append(
            f"DTEND;TZID=Europe/London:{event.end_time.strftime('%Y%m%dT%H%M%S')}"
        )
        lines.append(f"SUMMARY:{event.title}")
        lines.append(f"DESCRIPTION:{event.description}")
        lines.append(f"LOCATION:{event.location}")
        lines = self.append_recurrence_interval(lines, event)
        lines.append("END:VEVENT")
        return lines

    def append_recurrence_interval(self, lines, event):
        """Append recurrence rules to the iCalendar lines if the event is recurring.

        Args:
            lines (list[str]): The current list of iCalendar lines.
            event (Event): The event object to check for recurrence.

        Returns:
            list[str]: The updated list of iCalendar lines with recurrence rules.

        """
        # Not None means that the event is recurring
        if event.recurrence_interval is not None:
            # None means repeat forever
            if event.recurrence_end is None:
                lines.append(f"RRULE:FREQ={event.recurrence_interval.upper()}")
            # Not none means repeat until a specified date
            else:
                until = event.recurrence_end.strftime("%Y%m%dT%H%M%S")
                lines.append(
                    f"RRULE:FREQ={event.recurrence_interval.upper()};UNTIL={until}Z"
                )
        return lines
