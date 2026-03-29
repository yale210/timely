"""Views for importing event data from iCalendar files."""

from datetime import datetime
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import Event


class ImportView(APIView):
    """View for importing events from a .txt file in iCalendar format."""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _parse_ical_datetime(value: str) -> datetime:
        """Parse an iCalendar format datetime string into an aware datetime object.

        Args:
            value (str): The datetime string in YYYYMMDDTHHMMSS format.

        Returns:
            datetime: An aware datetime object.

        """
        parsed = datetime.strptime(value, "%Y%m%dT%H%M%S")
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed)
        return parsed

    def post(self, request):
        """Handle the import of events from a .txt file in iCalendar format.

        The file must follow the iCalendar format, with events defined between
        BEGIN:VEVENT and END:VEVENT.

        Args:
            request (Request): The DRF request object containing the uploaded file.

        Returns:
            Response: A DRF response indicating success or providing an error message.

        Raises:
            ValueError: If the file format is invalid or contains errors.

        """

        try:
            lines = self.check_file_structure(request)
            events = []
            current_event = None
            count = 0
            for line in lines:
                count = count + 1

                current_event = self.begin_event(line, current_event)

                current_event = self.prase_event(line, current_event)

                current_event, events = self.end_event(
                    line, current_event, request, events
                )

            # Every event is added to the DB
            with transaction.atomic():
                for event in events:
                    self.create_event_object(request, event)

            response = self.process_response(events)
            return Response(response)

        # File format incorrect, error response
        except Exception as e:
            response = {"error": str(e)}
            return Response(response, status=400)

    def check_file_structure(self, request):
        # The file that the user uploaded
        uploaded_file = request.FILES.get("file")

        # No file uploaded, this is an error
        if not uploaded_file:
            raise ValueError("No file uploaded")

        # The file uploaded is not a .txt file, this is an error
        if uploaded_file.content_type != "text/plain":
            raise ValueError("File type is not .txt")

        # Reading the file
        content = uploaded_file.read().decode("utf-8")

        lines = content.splitlines()

        # Empty .txt file -> nothing to import
        if len(lines) == 0:
            raise ValueError("Empty file")

        # File must begin with "BEGIN:VCALENDAR" -> otherwise it is not the correct format
        if lines[0] != "BEGIN:VCALENDAR":
            raise ValueError("File requires: BEGIN:VCALENDAR")

        # File must end with "END:VCALENDAR" -> otherwise it is not the correct format
        if lines[-1] != "END:VCALENDAR":
            raise ValueError("File requires: END:VCALENDAR")

        return lines

    def begin_event(self, line, current_event):
        if line == "BEGIN:VEVENT":
            if current_event is None:
                current_event = {}
            else:
                raise ValueError("Event indentation error")
        return current_event

    def prase_event(self, line, current_event):
        if current_event is not None:
            key, value = line.split(":", 1)
            current_event[key] = value
        return current_event

    def end_event(self, line, current_event, request, events):
        if line == "END:VEVENT":
            # No event being worked on currently, so ending an event is an error
            if current_event is None:
                raise ValueError("No event to end")

            summary = self.get_summary(current_event)
            dt_start = self.get_dt_start(current_event)
            dt_end = self.get_dt_end(current_event)
            description = current_event.get("DESCRIPTION")
            location = current_event.get("LOCATION")
            dt_stamp = self.get_dt_stamp(current_event)
            frequency_interval_final, until_date_final = self.get_r_rule(current_event)

            # True / False, does this event already exist?
            start_date_time_django_format = self._parse_ical_datetime(dt_start)
            end_date_time_django_format = self._parse_ical_datetime(dt_end)

            events = self.append_event_to_list(
                request,
                summary,
                description,
                location,
                dt_stamp,
                start_date_time_django_format,
                end_date_time_django_format,
                frequency_interval_final,
                until_date_final,
                events,
            )

            current_event = None
        return current_event, events

    def create_event_object(self, request, event):
        Event.objects.create(
            user=request.user,
            title=event["title"],
            description=event["description"],
            location=event["location"],
            start_time=event["start_time"],
            end_time=event["end_time"],
            recurrence_interval=event["r_rule_freq"],
            recurrence_end=event["r_rule_until"],
        )

    def process_response(self, events):
        # Response letting the user know that the import was successful
        if len(events) == 0:
            # 0 events is not strictly an error, as an error is wrong file type
            response = {
                "message": "0 Events were imported, but the file is correctly formatted. Check for duplicates?"
            }
        else:
            response = {
                "message": f"Import successful! Imported: {len(events)} event(s)."
            }
        return response

    def get_summary(self, current_event):
        if "SUMMARY" in current_event:
            summary = current_event["SUMMARY"]

        else:
            raise ValueError("One or more events don't have a summary")
        return summary

    def get_dt_start(self, current_event):
        dt_start = None
        # Search every key
        for key in current_event:
            if "DTSTART" in key:
                # The actual date/time of the event
                dt_start = current_event[key]

        # Start date/time is required
        if dt_start is None:
            raise ValueError("One or more events don't have a DTSTART")

        return dt_start

    def get_dt_end(self, current_event):
        # Assume that the event is invalid
        dt_end = None
        # Search every key
        for key in current_event:
            if "DTEND" in key:
                # The actual date/time of the event
                dt_end = current_event[key]

        # End date/time is required
        if dt_end is None:
            raise ValueError("One or more events don't have a DTEND")

        return dt_end

    def get_dt_stamp(self, current_event):
        # A DTSTAMP is optional, no error for it not existing,
        if "DTSTAMP" in current_event:
            dt_stamp_unformatted = current_event["DTSTAMP"]
            dt_stamp = dt_stamp_unformatted[:-1]
        else:
            # Current date/time
            current_date_time_unformatted = timezone.now()

            # This is the format that is required by iCalendar
            current_date_time = current_date_time_unformatted.strftime("%Y%m%dT%H%M%S")

            dt_stamp = current_date_time
        return dt_stamp

    def get_r_rule(self, current_event):
        if "RRULE" in current_event:
            r_rule = current_event["RRULE"]

            parts_of_r_rule = r_rule.split(";")

            r_rule_dictionary = {}

            for part in parts_of_r_rule:
                k, v = part.split("=")
                r_rule_dictionary[k] = v

            frequency_interval = r_rule_dictionary.get("FREQ")

            until_date = r_rule_dictionary.get("UNTIL")

            # E.g. DAILY
            frequency_interval_final = Event.RecurrenceInterval[frequency_interval]

            # None means repeat indefinitely, else a date will be specified
            if until_date is None:
                until_date_final = None
            else:
                until_date_modified = until_date[:-1]
                until_date_final = datetime.strptime(
                    until_date_modified, "%Y%m%dT%H%M%S"
                ).date()

        else:
            frequency_interval_final = None
            until_date_final = None

        return frequency_interval_final, until_date_final

    def append_event_to_list(
        self,
        request,
        summary,
        description,
        location,
        dt_stamp,
        start_date_time_django_format,
        end_date_time_django_format,
        frequency_interval_final,
        until_date_final,
        events,
    ):
        event_exists_pre_import = Event.objects.filter(
            user=request.user,
            title=summary,
            start_time=start_date_time_django_format,
            end_time=end_date_time_django_format,
        ).exists()

        if not event_exists_pre_import:
            new_event_to_import_data = {
                "title": f"{summary}",
                "description": f"{description}",
                "location": f"{location}",
                "dt_stamp": f"{dt_stamp}",
                "start_time": start_date_time_django_format,
                "end_time": end_date_time_django_format,
                "r_rule_freq": frequency_interval_final,
                "r_rule_until": until_date_final,
            }

            # This is the list of events to import at the very end, this current event is added to it
            events.append(new_event_to_import_data)
        return events
