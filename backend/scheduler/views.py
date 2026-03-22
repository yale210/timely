from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Task
from scheduler.serializers import ScheduleRequestSerializer, ScheduleResultSerializer
from scheduler.services import Scheduler


class ScheduleTasksAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        start_date = payload.get("start_date") or timezone.localdate()
        max_days_ahead = payload.get("max_days_ahead", 7)
        allow_split = payload.get("allow_split", False)
        min_block_minutes = payload.get("min_block_minutes", 30)

        scheduler = Scheduler(
            request.user,
            max_days_ahead=max_days_ahead,
            allow_split=allow_split,
            min_block_minutes=min_block_minutes,
        )
        results = scheduler.schedule_tasks(start_date=start_date)

        scheduled_count = 0
        failed_count = 0

        with transaction.atomic():
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
                task.start_time = segments[0][0]
                task.allocation = allocation
                task.total_task_allocations = len(allocation)
                task.save(
                    update_fields=[
                        "start_time",
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = (
            Task.objects.filter(user=request.user)
            .exclude(allocation=[])
            .filter(completed=False, locked=False)
            .update(allocation=[], total_task_allocations=0, start_time=F("deadline"))
        )
        return Response(
            {"unscheduled_count": updated},
            status=status.HTTP_200_OK,
        )
