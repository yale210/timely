from celery import shared_task
from django.core.management import call_command


@shared_task
def run_sync_cal_command(user: str | None = None):
    """Run the ``manage.py sync_cal`` command from Celery."""
    if user:
        call_command("sync_cal", user=user)
    else:
        call_command("sync_cal")
