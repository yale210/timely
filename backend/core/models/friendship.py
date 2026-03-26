"""Friendship model definition."""

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.utils import timezone


class Friendship(models.Model):
    """Model used to allow for users to send friend requests and create friendships.

    A friendship is represented by a single record with a state of SENT, ACCEPTED or DECLINED.
    """

    class State(models.TextChoices):
        """Supported friendship values."""

        SENT = "SENT", "Sent"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friend_request_sender",
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="friend_request_receiver",
    )

    state = models.CharField(
        max_length=50,
        choices=State.choices,
        default=State.SENT,
    )

    # Stores the time when it was updated. This can be used to calculate a "friends since" feature
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["sender", "receiver"], name="unique_friend_request"
            )
        ]

    def __str__(self):
        """Return a string representation of the friendship.

        Returns:
            str: A string representation of the friendship.
        """
        return f"User: {self.sender} sent a friend request to {self.receiver}. State: {self.state}"

    def clean(self):
        """Prevent invalid friendship states.

        Raises:
            ValidationError: If the sender and receiver are the same user.
        """
        if self.sender == self.receiver:
            raise ValidationError("A user cannot friend themselves.")

    @classmethod
    def send_request(cls, sender, receiver):
        """Send a friend request from a sender to a receiver.

        If a request already exists, it becomes SENT if it was previously declined.

        Otherwise, an error is raised if the users are already friends or a request is pending.

        Args:
            sender (User): The user sending the friend request.
            receiver (User): The user receiving the friend request.

        Returns:
            Friendship: The created or the updated instance of friendship.

        Raises:
            ValidationError: If the sender and receiver are the same user, request is already pending, or users are already friends with each other.
        """
        if sender == receiver:
            raise ValidationError("A user cannot friend themselves.")

        # Check for existing friendship
        request_exists = (
            cls.objects.filter(
                Q(sender=sender, receiver=receiver)
                | Q(sender=receiver, receiver=sender)
            )
        ).first()

        if request_exists:
            if request_exists.state == cls.State.ACCEPTED:
                raise ValidationError("Users are already friends.")

            elif request_exists.state == cls.State.SENT:
                raise ValidationError("Request already sent.")
            # User has had their request declined. Send it again.
            else:
                request_exists.state = cls.State.SENT
                if (
                    request_exists.sender != sender
                    or request_exists.receiver != receiver
                ):
                    request_exists.sender = sender
                    request_exists.receiver = receiver
                request_exists.save()
                return request_exists
        else:
            # No request existed so make one.
            return cls.objects.create(
                sender=sender, receiver=receiver, state=cls.State.SENT
            )

    def accept_friend_request(self):
        """Accept a friend request.

        The state of the friendship is changed to ACCEPTED.
        """
        self.state = self.State.ACCEPTED
        self.updated_at = timezone.now()
        self.save()

    def decline_friend_request(self):
        """Decline a friend request.

        The state of the friendship is changed to DECLINED.
        """
        self.state = self.State.DECLINED
        self.updated_at = timezone.now()
        self.save()
