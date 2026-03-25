"""Celery application bootstrap for Timely background workers."""

import os

from celery import Celery

# Share the Django settings module between the web app and Celery workers.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "source.settings")

app = Celery("source")

# Load Celery settings from Django using the ``CELERY_`` prefix convention.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Autodiscover task modules from installed Django apps.
app.autodiscover_tasks()
