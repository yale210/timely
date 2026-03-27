"""Services for synchronizing course events with external and internal calendars.

This module provides logic for mapping course events to calendar provider formats
and reconciling them with user personal calendars (e.g., Google Calendar) or
the internal core Event model.
"""

import logging

from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()