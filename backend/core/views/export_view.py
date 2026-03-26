"""View for exporting events."""

from rest_framework import permissions
from rest_framework.views import APIView
from django.http import HttpResponse
from core.models import Event


class ExportView(APIView):
    """Export the authenticated user's events in a .txt file in iCalendar format."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Handle requests for exporting a user's events.

        Generates a .txt file.
        """
        # All of the events that belong to the user
        events = Event.objects.filter(user=request.user)

        # Every file requires this metadata at the top, this is not any event
        lines = []
        lines.append("BEGIN:VCALENDAR")
        lines.append("VERSION:2.0")
        lines.append("PRODID:TIMELY v1.0")
        lines.append("CALSCALE:GREGORIAN")
        lines.append("METHOD:PUBLISH")

        # Each Event will be appened one-by-one
        for event in events:
            lines.append("BEGIN:VEVENT")
            # Event ID, this is just e + the event id in the DB e.g. e123
            lines.append(f"UID:e{event.id}")
            lines.append(f"DTSTAMP:{event.last_edited.strftime('%Y%m%dT%H%M%S')}")
            lines.append(
                f"DTSTART;TZID=Europe/London:{event.start_time.strftime('%Y%m%dT%H%M%S')}"
            )
            lines.append(
                f"DTEND;TZID=Europe/London:{event.end_time.strftime('%Y%m%dT%H%M%S')}"
            )
            lines.append(f"SUMMARY:{event.title}")
            lines.append(f"DESCRIPTION:{event.description}")
            lines.append(f"LOCATION:{event.location}")

            # Not None means that the event is recurring
            if event.recurrence_interval is not None:
                # None means repeat forever
                if event.recurrence_end is None:
                    until = None
                # Not none means repeat until a specified date
                else:
                    until = event.recurrence_end.strftime("%Y%m%dT%H%M%S")
                # Recurrance rule standard format
                lines.append(
                    f"RRULE:FREQ={event.recurrence_interval.upper()};UNTIL={until}"
                )

            lines.append("END:VEVENT")

        # End of file standard format
        lines.append("END:VCALENDAR")

        # Join the lines
        content = "\n".join(lines)

        # Text File, this is what the user will download
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response
