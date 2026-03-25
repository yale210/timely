from rest_framework import permissions
from rest_framework.views import APIView
from django.http import HttpResponse
from core.models import Event


class ExportView(APIView):
    """
    Export the authenticated user's events in a .txt file in iCalendar format.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # All of the events that belong to the user
        events = Event.objects.filter(user=request.user)

        # Empty file
        lines = []
        # Begin
        lines.append("BEGIN:VCALENDAR")
        # Version
        lines.append("VERSION:2.0")
        # Production Identifier
        lines.append("PRODID:TIMELY v1.0")
        # Calendar Sysyem
        lines.append("CALSCALE:GREGORIAN")
        # Method
        lines.append("METHOD:PUBLISH")

        # Each Event
        for event in events:
            # Begin
            lines.append("BEGIN:VEVENT")
            # Event ID
            lines.append(f"UID:e{event.id}")
            # Last Modified
            lines.append("DTSTAMP:20260205T120548Z")
            # Start Date
            lines.append(
                f"DTSTART;TZID=Europe/London:{event.start_time.strftime('%Y%m%dT%H%M%S')}"
            )
            # End Date
            lines.append(
                f"DTEND;TZID=Europe/London:{event.end_time.strftime('%Y%m%dT%H%M%S')}"
            )
            # Summary
            lines.append(f"SUMMARY:{event.title}")
            # Description
            lines.append(f"DESCRIPTION:{event.description}")
            # Location
            lines.append(f"LOCATION:{event.location}")

            # Currently only recurrence until x date is supported
            if event.recurrence_interval is not None:
                # None means repeat forever
                if event.recurrence_end is None:
                    until = None
                # Not none means repeat until a specified date
                else:
                    until = event.recurrence_end.strftime("%Y%m%dT%H%M%S")
                # Recurrance rule
                lines.append(
                    f"RRULE:FREQ={event.recurrence_interval.upper()};UNTIL={until}"
                )

            # End
            lines.append("END:VEVENT")

        # End
        lines.append("END:VCALENDAR")

        # Join the lines
        content = "\n".join(lines)

        # Text File
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response
