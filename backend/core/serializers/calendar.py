from rest_framework import serializers
from core.models import Task, Category, Event

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'text']

class TaskSerializer(serializers.ModelSerializer):
    task_category = CategorySerializer(read_only=True)
    task_category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='task_category', write_only=True
    )

    class Meta:
        model = Task
        fields = [
            'id', 'user', 'task_message', 'task_category', 'task_category_id',
            'estimated_minutes', 'start_time', 'completed', 'deadline',
            'parent_task', 'importance', 'recurring', 'recurring_start', 'recurring_end'
        ]
        read_only_fields = ['user']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'