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

        start_date = payload.get("start_date") or timezone.localdate()
        preference = getattr(request.user, "preference", None)
        max_days_ahead = payload.get(
            "max_days_ahead",
            getattr(preference, "max_days_ahead", 30),
        )
        allow_split = payload.get("allow_split", False)
        replace_existing = payload.get("replace_existing", False)
        min_block_minutes = payload.get("min_block_minutes", 30)

        scheduled_count = 0
        failed_count = 0

        with transaction.atomic():
            if replace_existing:
                Task.objects.filter(user=request.user).exclude(allocation=[]).filter(
                    completed=False, locked=False
                ).update(allocation=[], total_task_allocations=0)

            scheduler = Scheduler(
                request.user,
                max_days_ahead=max_days_ahead,
                allow_split=allow_split,
                min_block_minutes=min_block_minutes,
            )
            results = scheduler.schedule_tasks(start_date=start_date)

            for result in results:
                segments = result.segments or []
                if not result.success or not segments:
                    failed_count += 1
                    continue

                try:
                    task = Task.objects.get(id=result.task_id, user=request.user)
                except Task.DoesNotExist:
                    failed_count += 1
                    continue

                allocation = [
                    {"start": start.isoformat(), "end": end.isoformat()}
                    for start, end in segments
                ]
                task.allocation = allocation
                task.total_task_allocations = len(allocation)
                task.save(
                    update_fields=[
                        "allocation",
                        "total_task_allocations",
                    ]
                )
                scheduled_count += 1

        response_data = {
            "start_date": start_date,
            "scheduled_count": scheduled_count,
            "failed_count": failed_count,
            "results": ScheduleResultSerializer(results, many=True).data,
        }
        return Response(response_data, status=status.HTTP_200_OK)


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
