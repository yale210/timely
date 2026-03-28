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

    @staticmethod
    def _read_uploaded_file(uploaded_file) -> str:
        """Validate the uploaded file object and return decoded content."""
        if not uploaded_file:
            raise ValueError("No file uploaded")
        if uploaded_file.content_type != "text/plain":
            raise ValueError("File type is not .txt")
        return uploaded_file.read().decode("utf-8")

    @staticmethod
    def _validate_calendar(lines: list[str]) -> None:
        """Validate the surrounding VCALENDAR wrapper."""
        if not lines:
            raise ValueError("Empty file")
        if lines[0] != "BEGIN:VCALENDAR":
            raise ValueError("File requires: BEGIN:VCALENDAR")
        if lines[-1] != "END:VCALENDAR":
            raise ValueError("File requires: END:VCALENDAR")

    @staticmethod
    def _matching_field(current_event: dict[str, str], prefix: str) -> str | None:
        """Return the first event field that matches a given key prefix."""
        for key, value in current_event.items():
            if prefix in key:
                return value
        return None

    def _parse_rrule(
        self, current_event: dict[str, str]
    ) -> tuple[str | None, datetime.date | None]:
        """Extract recurrence details from the event payload."""
        r_rule = current_event.get("RRULE")
        if r_rule is None:
            return None, None

        left, right = r_rule.split(";")
        _, frequency_interval = left.split("=")
        _, until_date = right.split("=")
        frequency_interval_final = Event.RecurrenceInterval[frequency_interval]

        if until_date == "None":
            return frequency_interval_final, None

        until_date_final = datetime.strptime(until_date[:-1], "%Y%m%dT%H%M%S").date()
        return frequency_interval_final, until_date_final

    def _build_event_to_import(
        self, current_event: dict[str, str], user
    ) -> dict[str, object] | None:
        """Validate a VEVENT block and build its import payload."""
        summary = current_event.get("SUMMARY")
        if summary is None:
            raise ValueError("One or more events don't have a summary")

        dt_start = self._matching_field(current_event, "DTSTART")
        if dt_start is None:
            raise ValueError("One or more events don't have a DTSTART")

        dt_end = self._matching_field(current_event, "DTEND")
        if dt_end is None:
            raise ValueError("One or more events don't have a DTEND")

        dt_stamp = current_event.get("DTSTAMP")
        if dt_stamp is not None:
            dt_stamp = dt_stamp[:-1]
        else:
            dt_stamp = timezone.now().strftime("%Y%m%dT%H%M%S")

        recurrence_interval, recurrence_end = self._parse_rrule(current_event)
        start_time = self._parse_ical_datetime(dt_start)
        end_time = self._parse_ical_datetime(dt_end)

        event_exists = Event.objects.filter(
            user=user,
            title=summary,
            start_time=start_time,
            end_time=end_time,
        ).exists()
        if event_exists:
            return None

        return {
            "title": summary,
            "description": current_event.get("DESCRIPTION"),
            "location": current_event.get("LOCATION"),
            "dt_stamp": dt_stamp,
            "start_time": start_time,
            "end_time": end_time,
            "r_rule_freq": recurrence_interval,
            "r_rule_until": recurrence_end,
        }

    def _persist_imported_event(self, request_user, event: dict[str, object]) -> None:
        """Create one imported event in the database."""
        common_fields = {
            "user": request_user,
            "title": event["title"],
            "description": event["description"],
            "location": event["location"],
            "start_time": event["start_time"],
            "end_time": event["end_time"],
        }

        if event.get("r_rule_freq") and event["r_rule_freq"] != "None":
            Event.objects.create(
                **common_fields,
                recurrence_interval=event["r_rule_freq"],
                recurrence_end=event["r_rule_until"],
            )
            return

        Event.objects.create(**common_fields)

    def _handle_calendar_line(
        self,
        line: str,
        current_event: dict[str, str] | None,
        events: list[dict[str, object]],
        request_user,
    ) -> dict[str, str] | None:
        """Handle one iCalendar line and update parsing state."""
        if line == "BEGIN:VEVENT":
            if current_event is not None:
                raise ValueError("Event indentation error")
            return {}

        if line == "END:VEVENT":
            if current_event is None:
                raise ValueError("No event to end")

            new_event = self._build_event_to_import(current_event, request_user)
            if new_event is not None:
                events.append(new_event)
            return None

        if current_event is None:
            return current_event

        key, value = line.split(":", 1)
        current_event[key] = value
        return current_event

    def _parse_import_events(
        self, lines: list[str], request_user
    ) -> list[dict[str, object]]:
        """Parse and queue all importable events from iCalendar lines."""
        events: list[dict[str, object]] = []
        current_event: dict[str, str] | None = None

        with transaction.atomic():
            for line in lines:
                current_event = self._handle_calendar_line(
                    line, current_event, events, request_user
                )

        return events

    def _build_import_response(self, event_count: int) -> Response:
        """Build the final API response for an import run."""
        if event_count == 0:
            return Response(
                {
                    "message": "0 Events were imported, but the file is correctly formatted. Check for duplicates?"
                }
            )

        return Response(
            {"message": f"Import successful! Imported: {event_count} event(s)."}
        )

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
        uploaded_file = request.FILES.get("file")
        try:
            content = self._read_uploaded_file(uploaded_file)
            lines = content.splitlines()
            self._validate_calendar(lines)
            events = self._parse_import_events(lines, request.user)

            for event in events:
                self._persist_imported_event(request.user, event)

            return self._build_import_response(len(events))

        # File format incorrect, error response
        except Exception as e:
            response = {"error": str(e)}
            return Response(response, status=400)
