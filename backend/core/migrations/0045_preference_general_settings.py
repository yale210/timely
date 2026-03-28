from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0044_remove_legacy_preference_columns"),
        ("core", "0044_delete_commute"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="default_landing_page",
            field=models.CharField(
                choices=[
                    ("dashboard", "Dashboard"),
                    ("calendar", "Calendar"),
                    ("tasks", "Tasks"),
                ],
                default="dashboard",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="preference",
            name="time_format",
            field=models.CharField(
                choices=[("24h", "24-hour"), ("12h", "12-hour")],
                default="24h",
                max_length=3,
            ),
        ),
        migrations.AddField(
            model_name="preference",
            name="week_starts_on",
            field=models.CharField(
                choices=[("monday", "Monday"), ("sunday", "Sunday")],
                default="monday",
                max_length=10,
            ),
        ),
    ]
