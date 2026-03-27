"""Serializer definitions for course resources."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models.course import Course, CourseEnrollment, CourseEvent, CourseJoinCode

User = get_user_model()


class CourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating courses."""

    class Meta:
        model = Course
        fields = ("id", "name", "description")
        read_only_fields = ("id",)

    def create(self, validated_data):
        """Create a course for the teacher provided in serializer context.

        Args:
            validated_data: The validated course payload.

        Returns:
            Course: The created course instance.
        """
        teacher = self.context["teacher"]
        return Course.objects.create(**validated_data, lead=teacher)


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for course responses."""

    class Meta:
        model = Course
        fields = ("id", "name", "description", "created_at", "active", "lead")
        read_only_fields = ("id", "created_at", "active", "lead")


class CourseEventSerializer(serializers.ModelSerializer):
    """Serializer for course events."""

    class Meta:
        model = CourseEvent
        fields = "__all__"
        read_only_fields = ("id", "course", "created_by", "created_at", "updated_at")

    def validate(self, data):
        """Validate the provided course event payload.

        Args:
            data: The incoming validated event data.

        Returns:
            dict: The validated event data.

        Raises:
            ValidationError: If the event end time is not after the start time.
        """
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class CourseNameSerializer(serializers.ModelSerializer):
    """Serializer for course name updates."""

    class Meta:
        model = Course
        fields = ("name",)


class CourseDescriptionSerializer(serializers.ModelSerializer):
    """Serializer for course description updates."""

    class Meta:
        model = Course
        fields = ("description",)


class CourseJoinCodeSerializer(serializers.Serializer):
    """Serializer for joining a course by code."""

    code = serializers.CharField(max_length=64)

    def validate_code(self, value):
        """Validate that the supplied join code exists.

        Args:
            value: The join code submitted by the caller.

        Returns:
            str: The validated join code.

        Raises:
            ValidationError: If the join code does not exist.
        """
        if not CourseJoinCode.objects.filter(code=value).exists():
            raise serializers.ValidationError("Invalid join code.")
        return value

    def create(self, validated_data):
        """Create or reactivate an enrollment for the supplied join code.

        Args:
            validated_data: The validated join code payload.

        Returns:
            CourseEnrollment: The created or existing enrollment instance.
        """
        code = validated_data["code"]
        course = Course.objects.get(join_code__code=code)
        enrollment, _ = CourseEnrollment.objects.get_or_create(
            course=course, student=self.context["request"].user
        )
        return enrollment


class CourseJoinCodeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating course join codes."""

    class Meta:
        model = CourseJoinCode
        fields = ("id", "code", "expires_at", "active")
        read_only_fields = ("id",)

    def create(self, validated_data):
        """Create a join code for the course in serializer context.

        Args:
            validated_data: The validated join code payload.

        Returns:
            CourseJoinCode: The created join code instance.
        """
        course = self.context["course"]
        return CourseJoinCode.objects.create(course=course, **validated_data)


class CourseStaffAddSerializer(serializers.Serializer):
    """Serializer for adding course staff members."""

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        """Validate that the provided user exists.

        Args:
            value: The submitted user identifier.

        Returns:
            int: The validated user identifier.

        Raises:
            ValidationError: If no user exists for the supplied identifier.
        """
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value
