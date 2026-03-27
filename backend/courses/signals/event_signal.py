"""Signal handlers for course event lifecycle changes."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from courses.models.course import CourseEnrollment, CourseEvent
from notifications.models.notification import Notification


@receiver(post_save, sender=CourseEvent)
def notify_enrolled_users_on_event_edit(sender, instance, created, **kwargs):
    """Create notifications for enrolled users when a course event is edited."""
    enrollments = (
        CourseEnrollment.objects.filter(course=instance.course, active=True)
        .select_related("student__user")
    )
    title = f"Updated event in {instance.course.name}"
    message = f"{instance.title} has been updated."
    sender_user = instance.created_by.user if instance.created_by else None
    if created:
        title = f"New event in {instance.course.name}"
        message = f"A new event {instance.title} on {instance.start_time} has been created."
    notifications = [
        Notification(
            recipient=enrollment.student.user,
            sender=sender_user,
            title=title,
            message=message,
            notification_type=Notification.NotificationType.CALENDAR,
        )
        for enrollment in enrollments
    ]

    Notification.objects.bulk_create(notifications)