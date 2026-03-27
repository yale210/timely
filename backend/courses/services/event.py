"""Services for synchronizing course events with external and internal calendars.

This module provides logic for mapping course events to calendar provider formats
and reconciling them with user personal calendars (e.g., Google Calendar) or
the internal core Event model.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional, Dict, Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
import logging


from core.models import Event


logger = logging.getLogger(__name__)

User = get_user_model()