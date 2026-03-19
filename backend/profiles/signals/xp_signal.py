from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from core.models.task import Task


def exp_required_for_level_up(user):
    next_level = user.level + 1
    required_xp = 100 * next_level**1.5
    return user.xp >= required_xp


def exp_required_for_level_down(user):
    next_level = user.level - 1
    required_xp = 100 * next_level**1.5
    return user.xp < required_xp


@receiver(pre_save, sender=Task)
def snapshot_task_state(sender, instance, **kwargs):
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
    prev = getattr(instance, "_prev_completed", False)
    now = instance.completed

    if prev == now:
        return

    user_profile = instance.user.user_profile
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
