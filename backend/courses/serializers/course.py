from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models.course import Course, CourseEvent, CourseJoinCode, CourseEnrollment

User = get_user_model()


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
        fields = ("id", "name", "description", "created_at", "active", "lead")
        read_only_fields = ("id", "created_at", "active", "lead")


class CourseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseEvent
        fields = "__all__"
        read_only_fields = ("id", "course", "created_by", "created_at", "updated_at")

    def validate(self, data):
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class CourseNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("name",)


class CourseDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("description",)


class CourseJoinCodeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=64)

    def validate_code(self, value):
        if not CourseJoinCode.objects.filter(code=value).exists():
            raise serializers.ValidationError("Invalid join code.")
        return value

    def create(self, validated_data):
        code = validated_data["code"]
        course = Course.objects.get(join_code__code=code)
        CourseEnrollment.objects.get_or_create(
            course=course, student=self.context["request"].user
        )


class CourseStaffAddSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value
