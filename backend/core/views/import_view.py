from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Event
from django.db import transaction
from datetime import datetime
from django.utils import timezone


class ImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # The file that the user uploaded
        uploaded_file = request.FILES.get("file")

        # No file uploaded, this is an error
        if not uploaded_file:
            response = {"error": "No file uploaded"}
            return Response(response)

        # The file uploaded is not a .txt file, this is an error
        elif uploaded_file.content_type != "text/plain":
            response = {"error": "File type is not .txt"}
            return Response(response)

        # Reading the file
        content = uploaded_file.read().decode("utf-8")

        # Lines of the file are put into a list
        lines = content.splitlines()

        # A list of all the events to be imported, updated as the file is read
        events = []

        # Tracks the current event being added, events will be added one-by-one
        current_event = None

        # Not all files submitted are valid -> there is a standard iCalendar, other files are invalid
        try:
            # Every event is uploaded to the DB, or none of them are -> Atomicity
            with transaction.atomic():
                # Empty .txt file -> nothing to import
                if len(lines) == 0:
                    raise ValueError("Empty file")

                # File must begin with "BEGIN:VCALENDAR" -> otherwise it is not the correct format
                elif lines[0] != "BEGIN:VCALENDAR":
                    raise ValueError("File requires: BEGIN:VCALENDAR")

                # File must end with "END:VCALENDAR" -> otherwise it is not the correct format
                elif lines[-1] != "END:VCALENDAR":
                    raise ValueError("File requires: END:VCALENDAR")

                # Line number tracker
                count = 0

                # Each lines is read one-by-one
                for line in lines:
                    count = count + 1

                    # This signifies that every line below it is information about the event
                    if line == "BEGIN:VEVENT":
                        # No event being worked on currently, so create a new one
                        if current_event is None:
                            # A dictionary is used here as this is what iCalendar uses
                            current_event = {}
                        # This error means that a new event was started before the previous one was ended
                        else:
                            raise ValueError("Event indentation error")

                    # This signifies that all the information about the event has been provided
                    elif line == "END:VEVENT":
                        # No event being worked on currently, so ending an event is an error
                        # (It is impossible to end an event if no event has started -> nothing to end)
                        if current_event is None:
                            raise ValueError("No event to end")

                        # If everything is correct so far, the event itself needs to be checked
                        else:
                            # Every event must have a name, start date/time and end date/time
                            # Everything else is optional e.g. "description", these will be checked and added seperatelty

                            # Summary is the name of the event, this is required
                            if "SUMMARY" in current_event:
                                summary = current_event["SUMMARY"]

                            else:
                                raise ValueError(
                                    "One or more events don't have a summary"
                                )

                            # Assume that the event is invalid
                            start_date_time_exists = False
                            # Search every key
                            for key in current_event:
                                if "DTSTART" in key:
                                    # The actual date/time of the event
                                    dt_start = current_event[key]

                                    # Date/time has been found
                                    start_date_time_exists = True

                            # Start date/time is required
                            if start_date_time_exists:
                                dt_start = dt_start
                            else:
                                raise ValueError(
                                    "One or more events don't have a DTSTART"
                                )

                            # Assume that the event is invalid
                            end_date_time_exists = False
                            # Search every key
                            for key in current_event:
                                if "DTEND" in key:
                                    # The actual date/time of the event
                                    dt_end = current_event[key]

                                    # Date/time has been found
                                    end_date_time_exists = True

                            # End date/time is required
                            if end_date_time_exists:
                                dt_end = dt_end
                            else:
                                raise ValueError(
                                    "One or more events don't have a DTEND"
                                )

                            # A description is optional, no error for it not existing
                            if "DESCRIPTION" in current_event:
                                description = current_event["DESCRIPTION"]
                            else:
                                description = None

                            # A location is optional, no error for it not existing
                            if "LOCATION" in current_event:
                                location = current_event["LOCATION"]
                            else:
                                location = None

                            # A DTSTAMP is optional, no error for it not existing,
                            if "DTSTAMP" in current_event:
                                dt_stamp = current_event["DTSTAMP"]
                            else:
                                # Current date/time
                                current_date_time_unformatted = timezone.now()

                                # This is the format that is required by iCalendar
                                current_date_time = (
                                    current_date_time_unformatted.strftime(
                                        "%Y%m%dT%H%M%S"
                                    )
                                )

                                dt_stamp = current_date_time

                            # A location is optional, no error for it not existing

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
                                    until_date_final = datetime.strptime(
                                        until_date, "%Y%m%dT%H%M%S"
                                    ).date()

                            else:
                                r_rule = None
                                frequency_interval_final = None
                                until_date_final = None

                            # The DB stores date/time using the DJango format, but iCalendar uses a different format so conversion is necessary
                            start_date_time_django_format = timezone.make_aware(
                                datetime.strptime(dt_start, "%Y%m%dT%H%M%S")
                            )
                            end_date_time_django_format = timezone.make_aware(
                                datetime.strptime(dt_end, "%Y%m%dT%H%M%S")
                            )

                            # True / False, does this event already exist?
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
                                new_event_to_import_data = [
                                    {
                                        "title": f"{summary}",
                                        "description": f"{description}",
                                        "location": f"{location}",
                                        "dt_stamp": f"{dt_stamp}",
                                        "start_time": f"{start_date_time_django_format}",
                                        "end_time": f"{end_date_time_django_format}",
                                        "r_rule_freq": f"{frequency_interval_final}",
                                        "r_rule_until": f"{until_date_final}",
                                    }
                                ]

                                # This is the list of events to import at the very end, this current event is added to it
                                events.append(new_event_to_import_data)

                            current_event = None

                    # Every line that is not a begin or end event contains information about the event
                    # All these lines follow the format of "variable:detail", e.g. LOCATION:London
                    # This can be represented as key:value pairs in a dictionary
                    elif current_event is not None:
                        key, value = line.split(":", 1)
                        current_event[key] = value

            # At this stage the file format is correct and all duplicate events have been ignored
            events = events

            # Every event is added to the DB
            for e in events:
                for event in e:
                    # Recurring eent
                    if ("r_rule_freq" in event) and (
                        event["r_rule_freq"] and event["r_rule_freq"] != "None"
                    ):
                        if event["r_rule_until"] == "None":
                            event["r_rule_until"] = None

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
            return Response(response)
