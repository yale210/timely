"""Management command for syncing course calendars."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from authentication.models import User

from courses.services.event import CourseEventSyncService


class Command(BaseCommand):
    """Management command for syncing course calendars."""

    help = "Sync all course events to user calendars"

    def add_arguments(self, parser):
        """Register command-line arguments for the sync command.

        Args:
            parser: The Django command parser.
        """
        parser.add_argument(
            "--user", type=str, help="Sync for specific user (username)"
        )

    def handle(self, *args, **options):
        """Run the course calendar sync command.

        Args:
            *args: Positional command arguments.
            **options: Parsed command options.
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
