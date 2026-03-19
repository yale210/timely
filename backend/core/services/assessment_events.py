from core.models import Assessment, Event


def create_assessment_event(assessment: Assessment) -> Event:
    """
    Creates an event for a given assessment.
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
    assessment.save(updated_fields=["linked_event", "updated_at"])

    return event


def delete_assessment_event(assessment: Assessment) -> None:
    """
    Deletes the event linked to a given assessment.
    """

    if assessment.linked_event:
        assessment.linked_event.delete()
        assessment.linked_event = None
        assessment.save(updated_fields=["linked_event", "updated_at"])
