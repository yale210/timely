"""Serializers for course-related data transfer objects.

This module provides DRF serializers for creating courses, managing enrollments,
handling course events, and processing join codes and staff assignments.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models.course import Course, CourseEvent, CourseJoinCode, CourseEnrollment

User = get_user_model()


class CourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for initial course creation.

    Specifically handles the assignment of the creator as the course lead
    during the creation process.
    """

    class Meta:
        """Meta options for CourseCreateSerializer."""

        model = Course
        fields = ("id", "name", "description")
        read_only_fields = ("id",)

    def create(self, validated_data):
        """Creates a new course and assigns the requesting teacher as lead.

        Args:
            validated_data: Dictionary of validated field values.

        Returns:
            The newly created Course instance.
        """
        teacher = self.context["teacher"]
        return Course.objects.create(**validated_data, lead=teacher)


class CourseSerializer(serializers.ModelSerializer):
    """General purpose serializer for Course objects.

    Provides a comprehensive read/write representation of the course entity,
    including its administrative metadata.
    """

    class Meta:
        """Meta options for CourseSerializer."""

        model = Course
        fields = ("id", "name", "description", "created_at", "active", "lead")
        read_only_fields = ("id", "created_at", "active", "lead")


class CourseEventSerializer(serializers.ModelSerializer):
    """Serializer for events specifically tied to a course.

    Ensures that event durations are valid by checking start and end times.
    """

    class Meta:
        """Meta options for CourseEventSerializer."""

        model = CourseEvent
        fields = "__all__"
        read_only_fields = ("id", "course", "created_by", "created_at", "updated_at")

    def validate(self, data):
        """Validates that the event's end time follows its start time.

        Args:
            data: Dictionary of input field values.

        Returns:
            The validated data dictionary.

        Raises:
            serializers.ValidationError: If end_time is not after start_time.
        """
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class CourseNameSerializer(serializers.ModelSerializer):
    """Lightweight serializer for updating only the course name."""

    class Meta:
        """Meta options for CourseNameSerializer."""

        model = Course
        fields = ("name",)


class CourseDescriptionSerializer(serializers.ModelSerializer):
    """Lightweight serializer for updating only the course description."""

    class Meta:
        """Meta options for CourseDescriptionSerializer."""

        model = Course
        fields = ("description",)


class CourseJoinCodeSerializer(serializers.Serializer):
    """Serializer for students joining a course via a code.

    Handles the validation of the code string and performs the enrollment
    operation upon creation.
    """

    code = serializers.CharField(max_length=64)

    def validate_code(self, value):
        """Checks if the provided join code exists in the database.

        Args:
            value: The code string to validate.

        Returns:
            The validated code string.

        Raises:
            serializers.ValidationError: If the code does not exist.
        """
        if not CourseJoinCode.objects.filter(code=value).exists():
            raise serializers.ValidationError("Invalid join code.")
        return value

    def create(self, validated_data):
        """Enrolls the requesting user into the course identified by the code.

        Args:
            validated_data: Dictionary containing the validated 'code'.
        """
        code = validated_data["code"]
        course = Course.objects.get(join_code__code=code)
        CourseEnrollment.objects.get_or_create(
            course=course, student=self.context["request"].user
        )


class CourseJoinCodeCreateSerializer(serializers.ModelSerializer):
    """Serializer for administrative creation of new course join codes."""

    class Meta:
        """Meta options for CourseJoinCodeCreateSerializer."""

        model = CourseJoinCode
        fields = ("id", "code", "expires_at", "active")
        read_only_fields = ("id",)

    def create(self, validated_data):
        """Creates a new join code associated with a specific course.

        Args:
            validated_data: Validated configuration for the new join code.

        Returns:
            The newly created CourseJoinCode instance.
        """
        course = self.context["course"]
        return CourseJoinCode.objects.create(course=course, **validated_data)


class CourseStaffAddSerializer(serializers.Serializer):
    """Serializer for identifying a user to be added as course staff."""

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        """Ensures the provided user ID corresponds to an existing system user.

        Args:
            value: The integer ID of the user.

        Returns:
            The validated user ID.

        Raises:
            serializers.ValidationError: If no user matches the provided ID.
        """
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value
