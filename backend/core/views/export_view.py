from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from django.http import HttpResponse
from core.models import Event, Task


class ExportView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # All of the events that belong to the user
        events = Event.objects.filter(user=request.user)
        
        # Empty file
        lines = []
        # Begin
        lines.append(f"BEGIN:VCALENDAR")
        # Version
        lines.append(f"VERSION:2.0")
        # Production Identifier
        lines.append(f"PRODID:TIMELY v1.0")
        # Calendar Sysyem
        lines.append(f"CALSCALE:GREGORIAN")
        # Method
        lines.append(f"METHOD:PUBLISH")
        
                      
        # Each Event
        for event in events:
            #Begin
            lines.append(f"BEGIN:VEVENT")
            # Event ID
            lines.append(f"UID:e{event.id}")
            # Last Modified
            lines.append(f"DTSTAMP:20260205T120548Z")
            # Start Date
            lines.append(f"DTSTART;TZID=Europe/London:{event.start_time.strftime("%Y%m%dT%H%M%S")}")
            # End Date
            lines.append(f"DTEND;TZID=Europe/London:{event.end_time.strftime("%Y%m%dT%H%M%S")}")
            # Summary
            lines.append(f"SUMMARY:{event.title}")
            # Description
            lines.append(f"DESCRIPTION:{event.description}")
            #Location
            lines.append(f"LOCATION:{event.location}")
            
            # Currently only recurrence until x date is supported
            if event.recurrence_interval != None:
                # None means repeat forever
                if event.recurrence_end == None:
                    until = None
                # Not none means repeat until a specified date
                else:
                    until = event.recurrence_end.strftime("%Y%m%dT%H%M%S")
                # Recurrance rule
                lines.append(f"RRULE:FREQ={event.recurrence_interval.upper()};UNTIL={until}")

            #End
            lines.append(f"END:VEVENT")

        # End
        lines.append(f"END:VCALENDAR")

        # Join the lines
        content = "\n".join(lines)

        # Text File
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = 'attachment; filename="events.txt"'
        return response