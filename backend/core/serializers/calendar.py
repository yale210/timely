from rest_framework import serializers
from core.models import Task, Category

class CalendarSerializer(serializers.ModelSerializer):
    task_category = serializers.StringRelatedField()  # returns category text

    class Meta:
        model = Task
        fields = ['id', 'task_message', 'task_category', 'start_time', 'deadline', 'importance', 'completed']