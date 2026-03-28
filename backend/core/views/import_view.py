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
        # The file that the user uploaded
        uploaded_file = request.FILES.get("file")

        # No file uploaded, this is an error
        if not uploaded_file:
            response = {"error": "No file uploaded"}
            return Response(response, status=400)

        # The file uploaded is not a .txt file, this is an error
        if uploaded_file.content_type != "text/plain":
            response = {"error": "File type is not .txt"}
            return Response(response, status=400)

        # Reading the file
        content = uploaded_file.read().decode("utf-8")

        lines = content.splitlines()

        events = []

        # Tracks the current event being added, events will be added one-by-one
        current_event = None

        try:
            with transaction.atomic():
                # Empty .txt file -> nothing to import
                if len(lines) == 0:
                    raise ValueError("Empty file")

                # File must begin with "BEGIN:VCALENDAR" -> otherwise it is not the correct format
                if lines[0] != "BEGIN:VCALENDAR":
                    raise ValueError("File requires: BEGIN:VCALENDAR")

                # File must end with "END:VCALENDAR" -> otherwise it is not the correct format
                if lines[-1] != "END:VCALENDAR":
                    raise ValueError("File requires: END:VCALENDAR")

                # Line number tracker
                count = 0

                for line in lines:
                    count = count + 1

                    # This signifies that every line below it is information about the event
                    if line == "BEGIN:VEVENT":
                        if current_event is None:
                            current_event = {}
                        # This error means that a new event was started before the previous one was ended
                        else:
                            raise ValueError("Event indentation error")

                    # This signifies that all the information about the event has been provided
                    elif line == "END:VEVENT":
                        # No event being worked on currently, so ending an event is an error
                        if current_event is None:
                            raise ValueError("No event to end")

                        # If everything is correct so far, the event itself needs to be checked
                        # Summary is the name of the event, this is required
                        if "SUMMARY" in current_event:
                            summary = current_event["SUMMARY"]

                        else:
                            raise ValueError("One or more events don't have a summary")

                        # Assume that the event is invalid
                        dt_start = None
                        # Search every key
                        for key in current_event:
                            if "DTSTART" in key:
                                # The actual date/time of the event
                                dt_start = current_event[key]

                        # Start date/time is required
                        if dt_start is None:
                            raise ValueError("One or more events don't have a DTSTART")

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

                        # A description is optional, no error for it not existing
                        description = current_event.get("DESCRIPTION")

                        # A location is optional, no error for it not existing
                        location = current_event.get("LOCATION")

                        # A DTSTAMP is optional, no error for it not existing,
                        if "DTSTAMP" in current_event:
                            dt_stamp_unformatted = current_event["DTSTAMP"]
                            dt_stamp = dt_stamp_unformatted[:-1]
                        else:
                            # Current date/time
                            current_date_time_unformatted = timezone.now()

                            # This is the format that is required by iCalendar
                            current_date_time = current_date_time_unformatted.strftime(
                                "%Y%m%dT%H%M%S"
                            )

                            dt_stamp = current_date_time

                        if "RRULE" in current_event:
                            r_rule = current_event["RRULE"]

                            left, right = r_rule.split(";")

                            _, frequency_interval = left.split("=")

                            _, until_date = right.split("=")

                            # E.g. DAILY
                            frequency_interval_final = Event.RecurrenceInterval[
                                frequency_interval
                            ]

                            # None means repeat indefinitely, else a date will be specified
                            if until_date == "None":
                                until_date_final = None
                            else:
                                until_date_modified = until_date[:-1]
                                until_date_final = datetime.strptime(
                                    until_date_modified, "%Y%m%dT%H%M%S"
                                ).date()

                        else:
                            frequency_interval_final = None
                            until_date_final = None

                        # True / False, does this event already exist?
                        start_date_time_django_format = self._parse_ical_datetime(
                            dt_start
                        )
                        end_date_time_django_format = self._parse_ical_datetime(dt_end)

                        event_exists_pre_import = Event.objects.filter(
                            user=request.user,
                            title=summary,
                            start_time=start_date_time_django_format,
                            end_time=end_date_time_django_format,
                        ).exists()

                        # This event is a new event, so it will be added to the DB, this event will be added to the list
                        # This approach ensures that if the file is broken halfway through, there will not be a scenario where half
                        # of the events are imported but the other half are not
                        if not event_exists_pre_import:
                            # Event data to add
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

                        current_event = None

                    # Every line that is not a begin or end event contains information about the event
                    # All these lines follow the format of "variable:detail", e.g. LOCATION:London
                    elif current_event is not None:
                        key, value = line.split(":", 1)
                        current_event[key] = value

            # Every event is added to the DB
            for event in events:
                # Recurring event
                if event.get("r_rule_freq") and event["r_rule_freq"] != "None":
                    until_date = event["r_rule_until"]
                    if until_date == "None":
                        until_date = None

                    Event.objects.create(
                        user=request.user,
                        title=event["title"],
                        description=event["description"],
                        location=event["location"],
                        start_time=event["start_time"],
                        end_time=event["end_time"],
                        recurrence_interval=event["r_rule_freq"],
                        recurrence_end=until_date,
                    )

                # One-time event
                else:
                    Event.objects.create(
                        user=request.user,
                        title=event["title"],
                        description=event["description"],
                        location=event["location"],
                        start_time=event["start_time"],
                        end_time=event["end_time"],
                    )

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
            return Response(response)

        # File format incorrect, error response
        except Exception as e:
            response = {"error": str(e)}
            return Response(response, status=400)
