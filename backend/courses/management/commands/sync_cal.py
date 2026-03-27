"""Management command to synchronize course events with user calendars.

This command triggers the synchronization service to ensure that all course-related
events are correctly reflected in the personal calendars of enrolled users. It can
be run for all users or targeted at a specific username.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from authentication.models import User
from courses.services.core_event_sync import CourseEventSyncService


class Command(BaseCommand):
    """Management command to sync course events to user calendars.

    Iterates through users and invokes the CourseEventSyncService to reconcile
    CourseEvent objects with the user's personal event collection.
    """

    help = "Sync all course events to user calendars"

    def add_arguments(self, parser):
        """Defines the command line arguments for the sync command.

        Allows specifying a single user by username to narrow the synchronization
        scope, which is useful for debugging or on-demand updates.

        Args:
            parser: The argument parser instance to add arguments to.
        """
        parser.add_argument(
            "--user", type=str, help="Sync for specific user (username)"
        )

    def handle(self, *args, **options):
        """Executes the synchronization logic based on provided options.

        Fetches the target user(s) and delegates the sync process to the
        CourseEventSyncService. Outputs the results (created/updated counts) to stdout.

        Args:
            *args: Variable length argument list.
            **options: Arbitrary keyword arguments containing parsed command options.
        """
        if options["user"]:
            user = get_user_model().objects.get(username=options["user"])
            stats = CourseEventSyncService.sync_user_course_events(user)
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Synced for {user.username}: "
                    f"Created={stats['created']}, Updated={stats['updated']}"
                )
            )
        else:
            # Sync for all users
            all_users = User.objects.all()
            total_created = 0
            total_updated = 0

            for user in all_users:
                stats = CourseEventSyncService.sync_user_course_events(user)
                total_created += stats["created"]
                total_updated += stats["updated"]

            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Synced all users: "
                    f"Created={total_created}, Updated={total_updated}"
                )
            )
