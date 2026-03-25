from rest_framework import permissions
from rest_framework.views import APIView
from django.http import HttpResponse
from core.models import Event


class ExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # All of the events that belong to the user
        events = Event.objects.filter(user=request.user)

        lines = []
        # Begin file required as standard format
        lines.append("BEGIN:VCALENDAR")
        # Version required as standard format
        lines.append("VERSION:2.0")
        # Production Identifier required as standard format
        lines.append("PRODID:TIMELY v1.0")
        # Calendar System required as standard format
        lines.append("CALSCALE:GREGORIAN")
        # Method required as standard format
        lines.append("METHOD:PUBLISH")

        # Each Event will be appened one-by-one
        for event in events:
            # Begin event standard format
            lines.append("BEGIN:VEVENT")
            # Event ID, this is just e + the event id in the DB
            lines.append(f"UID:e{event.id}")
            # Last Modified standard foramt, not tracked by the DB so date irrelevant
            lines.append(f"DTSTAMP:{event.last_edited.strftime('%Y%m%dT%H%M%S')}")
            # Start Date standard format
            lines.append(
                f"DTSTART;TZID=Europe/London:{event.start_time.strftime('%Y%m%dT%H%M%S')}"
            )
            # End Date standard format
            lines.append(
                f"DTEND;TZID=Europe/London:{event.end_time.strftime('%Y%m%dT%H%M%S')}"
            )
            # Summary standard format
            lines.append(f"SUMMARY:{event.title}")
            # Description standard format
            lines.append(f"DESCRIPTION:{event.description}")
            # Location standard format
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

            # End of event standard format
            lines.append("END:VEVENT")

        # End of file standard format
        lines.append("END:VCALENDAR")

        # Join the lines
        content = "\n".join(lines)

        # Text File
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response
