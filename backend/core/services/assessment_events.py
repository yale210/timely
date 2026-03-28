"""Helpers for keeping assessments and linked events in sync."""

from core.models import Assessment, Event


def create_assessment_event(assessment: Assessment) -> Event:
    """Create an event for a given assessment.

    Returns:
        Event: The created linked event.

    """
    event = Event.objects.create(
        user=assessment.user,
        title=assessment.title,
        description=assessment.notes,
        location=assessment.location,
        start_time=assessment.start_time,
        end_time=assessment.end_time,
    )

    assessment.linked_event = event
    assessment.save(update_fields=["linked_event", "updated_at"])

    return event


def delete_assessment_event(assessment: Assessment) -> None:
    """Deletes the event linked to a given assessment."""
    if assessment.linked_event:
        assessment.linked_event.delete()
        assessment.linked_event = None
        assessment.save(update_fields=["linked_event", "updated_at"])


def update_assessment_event(assessment: Assessment) -> Event:
    """Update the event linked to an assessment.

    Returns:
        Event: The updated linked event.

    """
    if assessment.linked_event:
        event = assessment.linked_event
        event.title = assessment.title
        event.description = assessment.notes
        event.location = assessment.location
        event.start_time = assessment.start_time
        event.end_time = assessment.end_time
        event.save()

    return assessment.linked_event
