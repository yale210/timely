"""Views for the scheduler application."""

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Task
from scheduler.serializers import ScheduleRequestSerializer, ScheduleResultSerializer
from scheduler.services import Scheduler


class ScheduleTasksAPIView(APIView):
    """API view for scheduling tasks.

    This view handles POST requests to initiate the task scheduling process
    for the authenticated user based on their preferences and request data.
    """

    permission_classes = [permissions.IsAuthenticated]

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
        return (
            Task.objects.filter(user=user)
            .exclude(allocation=[])
            .filter(completed=False, locked=False)
            .update(allocation=[], total_task_allocations=0)
        )

    def _persist_schedule_results(self, user, results):
        scheduled_count = 0
        failed_count = 0
        for result in results:
            if self._persist_schedule_result(user, result):
                scheduled_count += 1
            else:
                failed_count += 1
        return scheduled_count, failed_count

    def _persist_schedule_result(self, user, result):
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
        return [
            {"start": start.isoformat(), "end": end.isoformat()}
            for start, end in segments
        ]


class UnscheduleTasksAPIView(APIView):
    """API view for unscheduling tasks.

    This view handles POST requests to clear scheduling allocations for
    tasks that are not completed or locked.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Handle task unscheduling request.

        Args:
            request: The DRF request object.

        Returns:
            A Response object with the count of unscheduled tasks.
        """
        updated = (
            Task.objects.filter(user=request.user)
            .exclude(allocation=[])
            .filter(completed=False, locked=False)
            .update(allocation=[], total_task_allocations=0)
        )
        return Response(
            {"unscheduled_count": updated},
            status=status.HTTP_200_OK,
        )
