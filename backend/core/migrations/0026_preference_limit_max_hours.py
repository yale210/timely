from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0025_preference_day_schedule"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="limit_max_hours",
            field=models.BooleanField(default=True),
        ),
    ]
