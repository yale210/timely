"""Serializers for assessments and their linked event payloads."""

from django.db import transaction
from rest_framework import serializers

from core.models import Assessment, Category, Event, EventReminder
from core.serializers.category_serializer import CategorySerializer
from core.serializers.event_serializer import EventResponseSerializer


class AssessmentEventInputSerializer(serializers.Serializer):
    """Serializer for inputting event details when creating or updating an assessment."""

    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    location = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        """Validate that the end time is after the start time.

        Returns:
            dict: The validated attributes for the event's details.

        Raises:
            ValidationError: If the end time isn't after the start time.
        """
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )
        return attrs


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for the Assessment model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    assessment_category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    module_category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )
    linked_event_details = serializers.SerializerMethodField(read_only=True)
    event_details = AssessmentEventInputSerializer(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Assessment
        fields = [
            "id",
            "user",
            "title",
            "assessment_type",
            "due_date",
            "length_of_assessment",
            "weighting_of_assessment",
            "notes",
            "reminder_offset",
            "assessment_category",
            "module_category",
            "categories",
            "completed",
            "linked_event",
            "linked_event_details",
            "event_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "linked_event",
            "linked_event_details",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        """Overrides the default __init__ to filter categories based on the user."""
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["categories"].queryset = Category.objects.filter(
                user=request.user
            )
            self.fields["assessment_category"].queryset = Category.objects.filter(
                user=request.user
            )
            self.fields["module_category"].queryset = Category.objects.filter(
                user=request.user
            )
        else:
            self.fields["categories"].queryset = Category.objects.none()
            self.fields["assessment_category"].queryset = Category.objects.none()
            self.fields["module_category"].queryset = Category.objects.none()

    def to_representation(self, instance):
        """Override to include category details in the serializer output.

        Returns:
            dict: The representation of the Assessment instance.
        """
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        representation["assessment_category"] = (
            CategorySerializer(instance.assessment_category).data
            if instance.assessment_category is not None
            else None
        )
        representation["module_category"] = (
            CategorySerializer(instance.module_category).data
            if instance.module_category is not None
            else None
        )
        return representation

    def get_linked_event_details(self, obj):
        """Get the details of the linked event.

        Returns:
            dict | None: The details of the linked event, or None.
        """
        if obj.linked_event is None:
            return None
        return EventResponseSerializer(obj.linked_event).data

    def validate(self, attrs):
        """Validate the assessment data.

        Returns:
            dict: The validated data.

        Raises:
            ValidationError: If the data is invalid.
        """
        attrs = super().validate(attrs)
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        event_details = attrs.get("event_details", serializers.empty)
        if event_details not in (serializers.empty, None):
            if event_details["start_time"] > due_date:
                raise serializers.ValidationError(
                    {
                        "event_details": (
                            "Assessment event start time cannot be after the assessment due date."
                        )
                    }
                )
        return attrs

    def _sync_event_reminders(self, event, reminder_offset):
        """Replace event reminders to match the assessment reminder offset."""

        event.reminders.all().delete()
        if reminder_offset is not None:
            EventReminder.objects.create(
                event=event,
                send_email=False,
                send_push=False,
                minutes_before=reminder_offset,
            )

    def _sync_linked_event(self, assessment, categories, event_details):
        """Create, update, or delete the event linked to an assessment."""

        if event_details is serializers.empty:
            if assessment.linked_event is None:
                return
            event = assessment.linked_event
            event.title = assessment.title
            event.description = assessment.notes
            event.save(update_fields=["title", "description"])
            event.categories.set(categories)
            self._sync_event_reminders(event, assessment.reminder_offset)
            return

        if event_details is None:
            if assessment.linked_event is not None:
                linked_event = assessment.linked_event
                assessment.linked_event = None
                assessment.save(update_fields=["linked_event"])
                linked_event.delete()
            return

        payload = {
            "title": assessment.title,
            "description": assessment.notes,
            "location": event_details.get("location", ""),
            "start_time": event_details["start_time"],
            "end_time": event_details["end_time"],
        }
        if assessment.linked_event is None:
            event = Event.objects.create(user=assessment.user, colour=None, **payload)
            assessment.linked_event = event
            assessment.save(update_fields=["linked_event"])
        else:
            event = assessment.linked_event
            for field, value in payload.items():
                setattr(event, field, value)
            event.save()
        event.categories.set(categories)
        self._sync_event_reminders(event, assessment.reminder_offset)

    @transaction.atomic
    def create(self, validated_data):
        """Create an assessment and its linked event.

        Args:
            validated_data (dict): The validated data for the assessment and the linked event.

        Returns:
            Assessment: The created assessment instance.
        """
        categories = validated_data.pop("categories", [])
        event_details = validated_data.pop("event_details", serializers.empty)
        assessment = Assessment.objects.create(**validated_data)
        if categories:
            assessment.categories.set(categories)
        self._sync_linked_event(assessment, categories, event_details)
        return assessment

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update an assessment and its linked event.

        Args:
            instance (Assessment): The assessment instance which is to be updated.
            validated_data (dict): The validated data for the assessment and its linked event.

        Returns:
            Assessment: The updated assessment instance.
        """
        categories = validated_data.pop("categories", None)
        event_details = validated_data.pop("event_details", serializers.empty)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        effective_categories = list(instance.categories.all())
        if categories is not None:
            instance.categories.set(categories)
            effective_categories = list(categories)

        self._sync_linked_event(instance, effective_categories, event_details)
        return instance
