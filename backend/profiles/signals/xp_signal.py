"""Signal handlers for profile XP and level updates."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from core.models.task import Task
from profiles.models.profile import Profile


def exp_required_for_level_up(user):
    """Return whether the user has enough XP to advance a level."""

    next_level = user.level + 1
    required_xp = 100 * next_level**1.5
    return user.xp >= required_xp


def exp_required_for_level_down(user):
    """Return whether the user should drop a level after XP loss."""

    next_level = user.level - 1
    required_xp = 100 * next_level**1.5
    return user.xp < required_xp


@receiver(pre_save, sender=Task)
def snapshot_task_state(sender, instance, **kwargs):
    """Capture a task's completion state before it is updated."""

    if instance.pk:
        try:
            instance._prev_completed = (
                Task.objects.filter(pk=instance.pk)
                .values_list("completed", flat=True)
                .get()
            )
        except Task.DoesNotExist:
            instance._prev_completed = False


@receiver(post_save, sender=Task)
def award_exp(sender, instance, **kwargs):
    """Adjust profile XP and level when a task completion state changes."""

    prev = getattr(instance, "_prev_completed", False)
    now = instance.completed

    if prev == now:
        return

    user_profile, _ = Profile.objects.get_or_create(
        user=instance.user,
        defaults={"name": instance.user.username},
    )
    xp_delta = 10 + (2 * instance.importance)

    if not prev and now:
        user_profile.xp += xp_delta
    elif prev and not now:
        user_profile.xp = max(0, user_profile.xp - xp_delta)

    while user_profile.xp > 1 and exp_required_for_level_up(user_profile):
        user_profile.level += 1

    while user_profile.xp > 1 and exp_required_for_level_down(user_profile):
        user_profile.level -= 1

    user_profile.save(update_fields=["xp", "level"])
