"""Tests for assessment events."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from core.services.assessment_events import (
    create_assessment_event,
    delete_assessment_event,
    update_assessment_event,
)


class AssessmentEventServiceTests(SimpleTestCase):
    def _build_assessment(self, **overrides):
        assessment = SimpleNamespace(
            user=object(),
            title="Operating Systems Exam",
            notes="Bring calculator",
            location="Room A1",
            start_time="2026-03-27T09:00:00+00:00",
            end_time="2026-03-27T11:00:00+00:00",
            linked_event=None,
        )
        assessment.save = Mock()
        for key, value in overrides.items():
            setattr(assessment, key, value)
        return assessment

    @patch("core.services.assessment_events.Event.objects.create")
    def test_create_assessment_event_creates_and_links_event(self, create_mock):
        event = object()
        create_mock.return_value = event
        assessment = self._build_assessment()

        created_event = create_assessment_event(assessment)

        self.assertIs(created_event, event)
        self.assertIs(assessment.linked_event, event)
        create_mock.assert_called_once_with(
            user=assessment.user,
            title=assessment.title,
            description=assessment.notes,
            location=assessment.location,
            start_time=assessment.start_time,
            end_time=assessment.end_time,
        )
        assessment.save.assert_called_once_with(
            update_fields=["linked_event", "updated_at"]
        )

    def test_delete_assessment_event_removes_existing_link(self):
        linked_event = Mock()
        assessment = self._build_assessment(linked_event=linked_event)

        delete_assessment_event(assessment)

        linked_event.delete.assert_called_once_with()
        self.assertIsNone(assessment.linked_event)
        assessment.save.assert_called_once_with(
            update_fields=["linked_event", "updated_at"]
        )

    def test_delete_assessment_event_noops_without_linked_event(self):
        assessment = self._build_assessment(linked_event=None)

        delete_assessment_event(assessment)

        assessment.save.assert_not_called()

    def test_update_assessment_event_updates_existing_linked_event(self):
        linked_event = Mock()
        assessment = self._build_assessment(linked_event=linked_event)

        updated_event = update_assessment_event(assessment)

        self.assertIs(updated_event, linked_event)
        self.assertEqual(linked_event.title, assessment.title)
        self.assertEqual(linked_event.description, assessment.notes)
        self.assertEqual(linked_event.location, assessment.location)
        self.assertEqual(linked_event.start_time, assessment.start_time)
        self.assertEqual(linked_event.end_time, assessment.end_time)
        linked_event.save.assert_called_once_with()

    def test_update_assessment_event_returns_none_when_no_linked_event(self):
        assessment = self._build_assessment(linked_event=None)

        self.assertIsNone(update_assessment_event(assessment))
        assessment.save.assert_not_called()
