import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0013_extract_notifications_models"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="Notification",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        ("title", models.CharField(max_length=255)),
                        ("message", models.TextField()),
                        ("is_read", models.BooleanField(default=False)),
                        ("timestamp", models.DateTimeField(auto_now_add=True)),
                        (
                            "notification_type",
                            models.CharField(
                                choices=[
                                    ("REMINDER", "Reminder"),
                                    ("ADMIN", "Admin"),
                                    ("SYSTEM", "System"),
                                ],
                                default="SYSTEM",
                                max_length=20,
                            ),
                        ),
                        (
                            "recipient",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="notifications",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                        (
                            "sender",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                related_name="sent_notifications",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "ordering": ["-timestamp"],
                        "db_table": "core_notification",
                    },
                ),
                migrations.CreateModel(
                    name="PushSubscription",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        ("endpoint", models.URLField(max_length=500)),
                        ("p256dh", models.CharField(max_length=255)),
                        ("auth", models.CharField(max_length=255)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        (
                            "user",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="push_subscriptions",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "db_table": "core_pushsubscription",
                        "unique_together": {("user", "endpoint")},
                    },
                ),
            ],
        ),
    ]
