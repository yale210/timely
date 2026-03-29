"""Views for the scheduler application."""

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer

from core.models import Task
from scheduler.serializers import ScheduleRequestSerializer, ScheduleResultSerializer
from scheduler.services import Scheduler


class ScheduleTasksAPIView(APIView):
    """API view for scheduling tasks.

    This view handles POST requests to initiate the task scheduling process
    for the authenticated user based on their preferences and request data.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=ScheduleRequestSerializer,
        responses={
            200: inline_serializer(
                name="ScheduleTasksResponse",
                fields={
                    "start_date": serializers.DateField(),
                    "scheduled_count": serializers.IntegerField(),
                    "failed_count": serializers.IntegerField(),
                    "results": ScheduleResultSerializer(many=True),
                },
            ),
        },
    )
    def post(self, request):
        """Handle task scheduling request.

        Args:
            request: The DRF request object containing scheduling parameters.

        Returns:
            A Response object with the results of the scheduling process.
        """
        serializer = ScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        options = self._resolve_schedule_options(request.user, payload)

        with transaction.atomic():
            if options["replace_existing"]:
                self._clear_existing_allocations(request.user)
            scheduler = Scheduler(
                request.user,
                max_days_ahead=options["max_days_ahead"],
                allow_split=options["allow_split"],
                min_block_minutes=options["min_block_minutes"],
            )
            results = scheduler.schedule_tasks(start_date=options["start_date"])
            scheduled_count, failed_count = self._persist_schedule_results(
                request.user,
                results,
            )

        response_data = {
            "start_date": options["start_date"],
            "scheduled_count": scheduled_count,
            "failed_count": failed_count,
            "results": ScheduleResultSerializer(results, many=True).data,
        }
        return Response(response_data, status=status.HTTP_200_OK)

    @staticmethod
    def _resolve_schedule_options(user, payload):
        """Resolve scheduling options from user preferences and request data.

        This method merges default user preferences with any overrides provided
        in the request payload to establish the final parameters for the
        scheduling algorithm.

        Args:
            user: The authenticated User object.
            payload: The validated data from the ScheduleRequestSerializer.

        Returns:
            A dictionary containing:
                - start_date (date): The date to begin scheduling from.
                - max_days_ahead (int): How many days into the future to search.
                - allow_split (bool): Whether tasks can be split into chunks.
                - replace_existing (bool): Whether to clear current allocations.
                - min_block_minutes (int): Minimum duration for a single block.
        """
        preference = getattr(user, "preference", None)
        return {
            "start_date": payload.get("start_date") or timezone.localdate(),
            "max_days_ahead": payload.get(
                "max_days_ahead",
                getattr(preference, "max_days_ahead", 30),
            ),
            "allow_split": payload.get("allow_split", False),
            "replace_existing": payload.get("replace_existing", False),
            "min_block_minutes": payload.get("min_block_minutes", 30),
        }

    @staticmethod
    def _clear_existing_allocations(user):
        """Clear all non-locked, incomplete task allocations for a user.

        This is typically called when 'replace_existing' is enabled in the
        scheduling request, ensuring a fresh start for the scheduling engine
        by wiping previous automated allocations.

        Args:
            user: The User object whose task allocations should be cleared.

        Returns:
            The number of task records updated (allocations cleared).
        """
        return (
            Task.objects.filter(user=user, allocation__isnull=False)
            .exclude(allocation=[])
            .filter(completed=False, locked=False)
            .update(allocation=[], total_task_allocations=0)
        )

    def _persist_schedule_results(self, user, results):
        """Persist multiple scheduling results to the database.

        Iterates through the results generated by the scheduler and attempts
        to update each corresponding task record with its new allocation.

        Args:
            user: The User object who owns the tasks.
            results: A list of ScheduleResult objects to persist.

        Returns:
            A tuple of (scheduled_count, failed_count) representing success metrics.
        """
        scheduled_count = 0
        failed_count = 0
        for result in results:
            if self._persist_schedule_result(user, result):
                scheduled_count += 1
            else:
                failed_count += 1
        return scheduled_count, failed_count

    def _persist_schedule_result(self, user, result):
        """Persist a single task's scheduling result to the database.

        Updates the Task model's 'allocation' JSON field with the serialised
        time segments if the scheduling attempt was successful.

        Args:
            user: The User object who owns the task.
            result: The ScheduleResult object for a specific task.

        Returns:
            bool: True if the task was successfully updated, False otherwise.
        """
        segments = result.segments or []
        if not result.success or not segments:
            return False
        try:
            task = Task.objects.get(id=result.task_id, user=user)
        except Task.DoesNotExist:
            return False
        allocation = self._serialise_allocation(segments)
        task.allocation = allocation
        task.total_task_allocations = len(allocation)
        task.save(update_fields=["allocation", "total_task_allocations"])
        return True

    @staticmethod
    def _serialise_allocation(segments):
        """Convert datetime segments into a JSON-serialisable format.

        Args:
            segments: A list of (start_datetime, end_datetime) tuples.

        Returns:
            A list of dictionaries with ISO-formatted string timestamps.
        """
        return [
            {"start": start.isoformat(), "end": end.isoformat()}
            for start, end in segments
        ]
