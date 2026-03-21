from rest_framework import serializers

from courses.models.course import Course, CourseEvent


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("id", "name", "description")
        read_only_fields = ("id",)

    def create(self, validated_data):
        teacher = self.context["teacher"]
        return Course.objects.create(**validated_data, lead=teacher)


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ("id", "lead", "active")


class CourseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseEvent
        fields = "__all__"
        read_only_fields = ("id", "course", "created_by", "created_at", "updated_at")
